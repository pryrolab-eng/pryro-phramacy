import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { isStaleRefreshTokenError } from "@/lib/auth/stale-session";
import {
  isAuthProcessingPath,
  isProtectedPath,
  isPublicAuthPath,
  middlewareShouldRun,
} from "@/lib/middleware/auth-routes";

const AUTH_TIMEOUT_MS =
  process.env.NODE_ENV === "development" ? 3_000 : 8_000;

function hasAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token"),
  );
}

function createSupabaseClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        response.cookies.set(name, value, options as never);
      },
      remove(name: string, options: Record<string, unknown>) {
        response.cookies.set(name, "", { ...options, maxAge: 0 } as never);
      },
    },
  });
}

async function clearStaleAuthCookies(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createServerClient>,
) {
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore — cookies are cleared below regardless */
  }
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-") && name.includes("auth-token")) {
      response.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  }
}

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
) {
  return Promise.race([
    supabase.auth.getUser(),
    new Promise<{ data: { user: null }; error: { message: string; code?: string } }>(
      (resolve) => {
        setTimeout(
          () =>
            resolve({
              data: { user: null },
              error: { message: "auth_timeout", code: "auth_timeout" },
            }),
          AUTH_TIMEOUT_MS,
        );
      },
    ),
  ]);
}

export const updateSession = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (!middlewareShouldRun(pathname)) {
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
    const supabase = createSupabaseClient(request, response);

    if (isProtectedPath(pathname)) {
      const {
        data: { user },
        error,
      } = await getUserWithTimeout(supabase);

      if (isStaleRefreshTokenError(error)) {
        await clearStaleAuthCookies(request, response, supabase);
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      if (!user) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      return response;
    }

    if (isPublicAuthPath(pathname) && hasAuthCookies(request)) {
      const {
        data: { user },
        error,
      } = await getUserWithTimeout(supabase);

      if (isStaleRefreshTokenError(error)) {
        await clearStaleAuthCookies(request, response, supabase);
        return response;
      }

      if (user) {
        return NextResponse.redirect(new URL("/app", request.url));
      }
    }

    return response;
  } catch {
    if (isProtectedPath(pathname)) {
      const fallback = NextResponse.redirect(new URL("/sign-in", request.url));
      if (hasAuthCookies(request)) {
        for (const { name } of request.cookies.getAll()) {
          if (name.startsWith("sb-") && name.includes("auth-token")) {
            fallback.cookies.set(name, "", { path: "/", maxAge: 0 });
          }
        }
      }
      return fallback;
    }

    if (hasAuthCookies(request)) {
      for (const { name } of request.cookies.getAll()) {
        if (name.startsWith("sb-") && name.includes("auth-token")) {
          response.cookies.set(name, "", { path: "/", maxAge: 0 });
        }
      }
    }
    return response;
  }
};
