import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");
  
  console.log('🔄 AUTH CALLBACK:', { code: !!code, redirect_to });

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  // For direct redirects (from sign-in action), just redirect
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('👤 CALLBACK USER:', user?.email || 'No user');

  // After OAuth, send everyone through onboarding first; middleware completes users go to /dashboard.
  const redirectTo = redirect_to || "/onboarding";
  console.log('➡️ CALLBACK REDIRECTING TO:', redirectTo);
  
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
} 