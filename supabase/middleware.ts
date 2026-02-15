import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  console.log('🔍 MIDDLEWARE:', request.nextUrl.pathname);
  
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(({ name, value }) => ({
              name,
              value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Clear invalid refresh tokens
    if (error?.message?.includes('refresh_token_not_found') || error?.message?.includes('Invalid Refresh Token')) {
      await supabase.auth.signOut();
      response.cookies.delete('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0] + '-auth-token');
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
      "/admin"
    ];
    
    const authPaths = ["/sign-in", "/sign-up", "/forgot-password", "/auth/success", "/auth/callback", "/auth-success", "/verify-2fa"];
    
    const isProtectedPath = protectedPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    if (isProtectedPath && (!user || error)) {
      console.log('➡️ REDIRECTING unauthenticated user to /sign-in');
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Redirect authenticated users away from auth pages (except success/callback)
    const publicAuthPaths = ["/sign-in", "/sign-up", "/forgot-password"];
    const isPublicAuthPath = publicAuthPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    if (isPublicAuthPath && user && !error) {
      console.log('➡️ REDIRECTING authenticated user from auth page to /dashboard');
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Allow auth success/callback pages to run without protection
    const isAuthProcessingPath = authPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    if (isAuthProcessingPath) {
      console.log('✅ ALLOWING auth processing path:', request.nextUrl.pathname);
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
