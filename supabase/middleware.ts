import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export const updateSession = async (request: NextRequest) => {
  try {
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
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
      }
    );

    const pathname = request.nextUrl.pathname;
    const isResetPasswordPath = pathname.startsWith("/dashboard/reset-password");
    const isAuthCallbackPath = pathname.startsWith("/auth/callback");
    const isAuthProcessingPath =
      pathname.startsWith("/auth/") ||
      pathname.startsWith("/auth-success") ||
      pathname.startsWith("/verify-2fa");

    // Refresh session — required for Server Components
    const { data: { user }, error } = await supabase.auth.getUser();

    // Clean up stale tokens
    if (
      !isResetPasswordPath &&
      !isAuthCallbackPath &&
      (error?.message?.includes("refresh_token_not_found") ||
        error?.message?.includes("Invalid Refresh Token"))
    ) {
      await supabase.auth.signOut();
      for (const { name } of request.cookies.getAll()) {
        if (name.startsWith("sb-") && name.includes("auth-token")) {
          response.cookies.set(name, "", { path: "/", maxAge: 0 });
        }
      }
    }

    // Allow auth processing paths through unconditionally
    if (isAuthProcessingPath) {
      return response;
    }

    const protectedPaths = [
      "/dashboard",
      "/superadmin",
      "/pharmacy-dashboard",
      "/pharmacist-dashboard",
      "/inventory",
      "/pos",
      "/sales",
      "/customers",
      "/branches",
      "/staff",
      "/settings",
      "/prescriptions",
      "/admin",
      "/onboarding",
    ];

    const isProtectedPath = protectedPaths.some((p) => pathname.startsWith(p));
    const isPublicAuthPath =
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/forgot-password");

    // Unauthenticated user hitting a protected path → sign-in
    if (isProtectedPath && (!user || error) && !isResetPasswordPath) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Authenticated user hitting a public auth page → dashboard
    // Only do the onboarding check on the auth pages, NOT on every dashboard navigation
    if (isPublicAuthPath && user && !error) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }
};
