import { type NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/auth-mode";
import {
  verifyRefreshJwt,
  verifySessionJwt,
} from "@/lib/auth/native/session-jwt";
import { trySilentNativeAccessRefresh } from "@/lib/auth/native/session-middleware";
import {
  isAuthProcessingPath,
  isProtectedPath,
  isPublicAuthPath,
  middlewareShouldRun,
} from "@/lib/middleware/auth-routes";
import { evaluateIpWhitelistForRequest } from "@/lib/security/ip-whitelist-enforcement";
import {
  hasSensitiveAuthQueryParams,
  stripSensitiveAuthQueryParams,
} from "@/lib/auth/sensitive-query-params";
import { enforcePlatformApiRateLimit, enforcePlatformIntegrationKeyRateLimit } from "@/lib/rate-limit/enforce";
import {
  getEnableRegistrations,
  isMaintenanceModeActive,
} from "@/lib/platform-settings";
import { isMaintenanceExemptPath } from "@/lib/platform-policy/maintenance";
import { storeGetIsPlatformAdmin } from "@/lib/db/public-users-store";

function hasAuthCookies(request: NextRequest): boolean {
  if (request.cookies.get(SESSION_COOKIE_NAME)?.value) return true;
  if (request.cookies.get(REFRESH_COOKIE_NAME)?.value) return true;
  return request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token"),
  );
}

function clearLegacySupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
) {
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-") && name.includes("auth-token")) {
      response.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  }
}

async function getNativeUserIdFromRequest(
  request: NextRequest,
): Promise<string | null> {
  const accessJwt = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (accessJwt) {
    const payload = await verifySessionJwt(accessJwt);
    if (payload?.sub) return payload.sub;
  }
  const refreshJwt = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshJwt) {
    const payload = await verifyRefreshJwt(refreshJwt);
    if (payload?.sub) return payload.sub;
  }
  return null;
}

function redirectWithoutSensitiveAuthParams(request: NextRequest) {
  const { sanitized } = stripSensitiveAuthQueryParams(request.nextUrl.searchParams);
  const clean = new URL(request.url);
  clean.search = sanitized.toString();
  return NextResponse.redirect(clean);
}

async function enforceIpWhitelistOrDeny(
  request: NextRequest,
  userId: string,
  mode: "page" | "api",
): Promise<NextResponse | null> {
  const ipDecision = await evaluateIpWhitelistForRequest(request, userId);
  if (ipDecision.allowed) return null;

  if (mode === "api") {
    return NextResponse.json(
      {
        error: "ip_not_allowed",
        message: "Your IP address is not on the allowlist for this workspace.",
        clientIp: ipDecision.clientIp || undefined,
      },
      { status: 403 },
    );
  }

  const denied = new URL("/access-denied", request.url);
  denied.searchParams.set("reason", "ip");
  if (ipDecision.clientIp) {
    denied.searchParams.set("ip", ipDecision.clientIp);
  }
  return NextResponse.redirect(denied);
}

export const updateSession = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (
    (isPublicAuthPath(pathname) || pathname === "/access-denied") &&
    hasSensitiveAuthQueryParams(request.nextUrl.searchParams)
  ) {
    return redirectWithoutSensitiveAuthParams(request);
  }

  const isApiPath = pathname.startsWith("/api/");

  if (pathname === "/sign-up" && !(await getEnableRegistrations())) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set(
      "error",
      "New registrations are temporarily disabled.",
    );
    return NextResponse.redirect(signIn);
  }

  if (!isMaintenanceExemptPath(pathname)) {
    const maintenanceActive = await isMaintenanceModeActive();
    if (maintenanceActive) {
      const maintenanceUserId = await getNativeUserIdFromRequest(request);
      const isPlatformAdmin = maintenanceUserId
        ? await storeGetIsPlatformAdmin(maintenanceUserId)
        : false;

      if (!isPlatformAdmin) {
        if (isApiPath) {
          return NextResponse.json(
            {
              error: "maintenance",
              message: "Pryrox is under maintenance. Please try again later.",
            },
            { status: 503 },
          );
        }
        if (pathname !== "/maintenance") {
          return NextResponse.redirect(new URL("/maintenance", request.url));
        }
      }
    }
  }

  if (isApiPath) {
    const keyRateLimited = await enforcePlatformIntegrationKeyRateLimit(request);
    if (keyRateLimited) return keyRateLimited;

    const rateLimited = await enforcePlatformApiRateLimit(request);
    if (rateLimited) return rateLimited;
    if (pathname === "/api/auth/signout") {
      return NextResponse.next();
    }
  }

  if (!middlewareShouldRun(pathname) && !isApiPath) {
    return NextResponse.next();
  }

  if (isApiPath && !hasAuthCookies(request)) {
    return NextResponse.next();
  }

  if (isPublicAuthPath(pathname) && !hasAuthCookies(request)) {
    return NextResponse.next();
  }

  if (isAuthProcessingPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    await trySilentNativeAccessRefresh(request, response);

    if (isProtectedPath(pathname)) {
      const nativeUserId = await getNativeUserIdFromRequest(request);
      if (!nativeUserId) {
        const redirect = NextResponse.redirect(new URL("/sign-in", request.url));
        clearLegacySupabaseAuthCookies(request, redirect);
        return redirect;
      }

      const ipDenied = await enforceIpWhitelistOrDeny(request, nativeUserId, "page");
      if (ipDenied) return ipDenied;
      return response;
    }

    if (pathname.startsWith("/api/") && hasAuthCookies(request)) {
      const nativeUserId = await getNativeUserIdFromRequest(request);
      if (nativeUserId) {
        const ipDenied = await enforceIpWhitelistOrDeny(request, nativeUserId, "api");
        if (ipDenied) return ipDenied;
      }
      return response;
    }

    if (isPublicAuthPath(pathname) && hasAuthCookies(request)) {
      const nativeUserId = await getNativeUserIdFromRequest(request);
      if (nativeUserId) {
        return NextResponse.redirect(new URL("/app", request.url));
      }
      clearLegacySupabaseAuthCookies(request, response);
    }

    return response;
  } catch {
    if (isProtectedPath(pathname)) {
      const fallback = NextResponse.redirect(new URL("/sign-in", request.url));
      clearLegacySupabaseAuthCookies(request, fallback);
      return fallback;
    }

    clearLegacySupabaseAuthCookies(request, response);
    return response;
  }
};
