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
import { POST_AUTH_ENTRY_PATH } from "@/lib/auth/resolve-home-redirect";
import { getAllowUserTwoFactor } from "@/lib/platform-security-policy";
import { RESET_PASSWORD_PATH } from "@/lib/middleware/auth-routes";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith("sb-") && name.includes("auth-token")) {
      try {
        cookieStore.set(name, "", { path: "/", maxAge: 0 });
      } catch {}
    }
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  const platformAllows2FA = await getAllowUserTwoFactor(supabase);

  const { data: userData } = await supabase
    .from('users')
    .select('two_factor_enabled')
    .eq('id', data.user.id)
    .single();

  if (platformAllows2FA && userData?.two_factor_enabled) {
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await supabase.from('two_factor_sessions').insert({
      user_id: data.user.id,
      session_token: sessionToken,
      verified: false,
      expires_at: expiresAt.toISOString()
    });

    await supabase.auth.signOut();
    return redirect(`/verify-2fa?session=${sessionToken}`);
  }

  redirect(POST_AUTH_ENTRY_PATH);
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

  const viaFallback = result.provider === "nodemailer" ? " (sent via backup email service)" : "";

  return encodedRedirect(
    "success",
    "/sign-in",
    `Check your email to confirm your account, then sign in.${viaFallback}`
  );
};

export const signInWithGoogleAction = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
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

  const result = await sendPasswordRecoveryEmail(email, RESET_PASSWORD_PATH);

  if (!result.ok) {
    return encodedRedirect("error", "/forgot-password", result.error);
  }

  const viaFallback = result.provider === "nodemailer" ? " (sent via backup email service)" : "";

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
    return encodedRedirect("error", RESET_PASSWORD_PATH, "Password fields are required.");
  }
  if (password !== confirmPassword) {
    return encodedRedirect("error", RESET_PASSWORD_PATH, "Passwords do not match.");
  }
  if (password.length < 6) {
    return encodedRedirect("error", RESET_PASSWORD_PATH, "Password must be at least 6 characters.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect(
      "error",
      RESET_PASSWORD_PATH,
      "Your reset link expired or is invalid. Request a new one from Forgot password.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return encodedRedirect("error", RESET_PASSWORD_PATH, error.message);
  }

  await supabase.auth.signOut();
  return encodedRedirect("success", "/sign-in", "Your password was updated. Sign in with your new password.");
};
