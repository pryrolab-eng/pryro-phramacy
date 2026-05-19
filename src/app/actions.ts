"use server";

import { encodedRedirect } from "@/utils/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import {
  sendPasswordRecoveryEmail,
  sendSignupConfirmationEmail,
} from "@/lib/email/auth-emails";
import crypto from "crypto";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith("sb-") && name.includes("auth-token")) {
      try {
        cookieStore.set(name, "", { path: "/", maxAge: 0 });
      } catch {
        /* ignore if cookie is not writable in this context */
      }
    }
  }

  const supabase = await createClient();

  console.log('🔐 LOGIN ATTEMPT:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log('❌ LOGIN ERROR:', error.message);
    return encodedRedirect("error", "/sign-in", error.message);
  }

  console.log('✅ LOGIN SUCCESS:', data.user?.email);

  // Verify session was created
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    console.log('❌ NO SESSION AFTER LOGIN');
    return encodedRedirect("error", "/sign-in", "Session creation failed");
  }

  // Setup test users if needed
  if (data.user && email.includes('@test.com')) {
    console.log('🧪 SETTING UP TEST USER');
    const role = email.includes('pharmacy') ? 'pharmacy_owner' : 
                 email.includes('pharmacist') ? 'pharmacist' : 'cashier';
    
    try {
      const { data: existingUser } = await supabase
        .from('pharmacy_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single();
      
      if (!existingUser) {
        console.log('👤 CREATING USER RECORDS');
        await Promise.all([
          supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            role: role
          }),
          supabase.from('pharmacy_users').upsert({
            pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            user_id: data.user.id,
            role: role,
            branch_id: null,
            is_active: true
          })
        ]);
      }
    } catch (setupError) {
      console.log('❌ USER SETUP ERROR:', setupError);
    }
  }

  // Check if 2FA is enabled
  const { data: userData } = await supabase
    .from('users')
    .select('two_factor_enabled')
    .eq('id', data.user.id)
    .single();

  if (userData?.two_factor_enabled) {
    console.log('🔐 2FA REQUIRED');
    // Create temporary session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    console.log('Creating session, expires:', expiresAt.toISOString());
    
    await supabase.from('two_factor_sessions').insert({
      user_id: data.user.id,
      session_token: sessionToken,
      verified: false,
      expires_at: expiresAt.toISOString()
    });
    
    // Sign out temporarily
    await supabase.auth.signOut();
    
    return redirect(`/verify-2fa?session=${sessionToken}`);
  }

  console.log('➡️ REDIRECTING TO DASHBOARD');
  redirect("/dashboard");
};

export const signUpAction = async (formData: FormData) => {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const full_name = ((formData.get("full_name") as string) || "").trim();

  if (!email || !password) {
    return encodedRedirect("error", "/sign-up", "Email and password are required.");
  }
  if (password.length < 6) {
    return encodedRedirect("error", "/sign-up", "Password must be at least 6 characters.");
  }

  const result = await sendSignupConfirmationEmail({
    email,
    password,
    fullName: full_name,
    redirectTo: "/onboarding",
  });

  if (!result.ok) {
    return encodedRedirect("error", "/sign-up", result.error);
  }

  if (result.sessionCreated) {
    redirect("/onboarding");
  }

  const viaFallback =
    result.provider === "nodemailer"
      ? " (sent via backup email service)"
      : "";

  return encodedRedirect(
    "success",
    "/sign-in",
    `Check your email to confirm your account, then sign in.${viaFallback}`
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  console.log('🚪 SIGNING OUT');
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = (formData.get("email") as string)?.trim();
  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required.");
  }

  const result = await sendPasswordRecoveryEmail(
    email,
    "/dashboard/reset-password"
  );

  if (!result.ok) {
    return encodedRedirect("error", "/forgot-password", result.error);
  }

  const viaFallback =
    result.provider === "nodemailer" ? " (sent via backup email service)" : "";

  return encodedRedirect(
    "success",
    "/forgot-password",
    `Check your email for a password reset link.${viaFallback}`
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password fields are required.",
    );
  }
  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match.",
    );
  }
  if (password.length < 6) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password must be at least 6 characters.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Your reset link expired or is invalid. Request a new one from Forgot password.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return encodedRedirect("error", "/dashboard/reset-password", error.message);
  }

  await supabase.auth.signOut();
  return encodedRedirect(
    "success",
    "/sign-in",
    "Your password was updated. Sign in with your new password.",
  );
};