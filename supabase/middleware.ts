import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * After login / sign-up, send users either to the dashboard or to onboarding
 * until they have a pharmacy and an active subscription.
 */
async function postAuthLandingPath(
  supabase: SupabaseClient,
  user: User
): Promise<"/dashboard" | "/onboarding"> {
  const { data: profile } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_platform_admin) {
    return "/dashboard";
  }

  const { data: memberships } = await supabase
    .from("pharmacy_users")
    .select("pharmacy_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const pharmacyId = memberships?.[0]?.pharmacy_id;
  if (!pharmacyId) {
    return "/onboarding";
  }

  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!activeSub) {
    return "/onboarding";
  }

  return "/dashboard";
}

export const updateSession = async (request: NextRequest) => {
  console.log('🔍 MIDDLEWARE:', request.nextUrl.pathname);
  
  try {
    // Create an unmodified response
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
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

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user }, error } = await supabase.auth.getUser();
    
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
    
    console.log('👤 USER:', user?.email || 'No user');
    console.log('❌ ERROR:', error?.message || 'No error');

    // protected routes - redirect to sign-in if no user
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
    
    const authPaths = ["/sign-in", "/sign-up", "/forgot-password", "/auth/success", "/auth/callback", "/auth-success", "/verify-2fa"];
    
    const pathname = request.nextUrl.pathname;

    const isProtectedPath = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (isProtectedPath && (!user || error)) {
      console.log("➡️ REDIRECTING unauthenticated user to /sign-in");
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (
      user &&
      !error &&
      isProtectedPath &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/payment-success") &&
      !pathname.startsWith("/dashboard/reset-password")
    ) {
      const landing = await postAuthLandingPath(supabase, user);
      if (landing === "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    if (pathname.startsWith("/onboarding") && user && !error) {
      const dest = await postAuthLandingPath(supabase, user);
      if (dest === "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Redirect authenticated users away from auth pages (except success/callback)
    const publicAuthPaths = ["/sign-in", "/sign-up", "/forgot-password"];
    const isPublicAuthPath = publicAuthPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (isPublicAuthPath && user && !error) {
      const dest = await postAuthLandingPath(supabase, user);
      console.log("➡️ REDIRECTING authenticated user from auth page to", dest);
      return NextResponse.redirect(new URL(dest, request.url));
    }
    
    // Allow auth success/callback pages to run without protection
    const isAuthProcessingPath = authPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (isAuthProcessingPath) {
      console.log("✅ ALLOWING auth processing path:", pathname);
      return response;
    }

    return response;
  } catch (e) {
    console.error('❌ MIDDLEWARE ERROR:', e);
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
