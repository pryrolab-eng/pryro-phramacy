import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
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

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
) {
  return Promise.race([
    supabase.auth.getUser(),
    new Promise<{ data: { user: null }; error: { message: string } }>(
      (resolve) => {
        setTimeout(
          () =>
            resolve({
              data: { user: null },
              error: { message: "auth_timeout" },
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

  // Public auth pages, no session cookie → allow through (sign-in form)
  if (isPublicAuthPath(pathname) && !hasAuthCookies(request)) {
    return NextResponse.next();
  }

  // OAuth / 2FA callbacks — no redirects here
  if (isAuthProcessingPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createSupabaseClient(request, response);

    // ── Protected app routes (/pos, /inventory, …): must validate with Supabase ──
    if (isProtectedPath(pathname)) {
      const {
        data: { user },
        error,
      } = await getUserWithTimeout(supabase);

      if (
        error?.message?.includes("refresh_token_not_found") ||
        error?.message?.includes("Invalid Refresh Token")
      ) {
        await supabase.auth.signOut();
        for (const { name } of request.cookies.getAll()) {
          if (name.startsWith("sb-") && name.includes("auth-token")) {
            response.cookies.set(name, "", { path: "/", maxAge: 0 });
          }
        }
      }

      if (!user) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      return response;
    }

    // ── Public auth pages only: light session read for “already logged in” redirect ──
    if (isPublicAuthPath(pathname)) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        return NextResponse.redirect(new URL("/app", request.url));
      }
    }

    return response;
  } catch {
    if (isProtectedPath(pathname)) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.next();
  }
};
