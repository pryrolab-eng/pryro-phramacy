"use server";

import { encodedRedirect } from "@/utils/utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  sendNativePasswordRecoveryEmail,
  sendNativeSignupConfirmationEmail,
} from "@/lib/email/native-auth-emails";
import crypto from "crypto";
import { POST_AUTH_ENTRY_PATH } from "@/lib/auth/resolve-home-redirect";
import { getAllowUserTwoFactor } from "@/lib/platform-security-policy";
import { RESET_PASSWORD_PATH } from "@/lib/middleware/auth-routes";
import { storeGetTwoFactorEnabled } from "@/lib/db/public-users-store";
import { storeCreateTwoFactorSession } from "@/lib/db/two-factor-sessions-store";
import { SESSION_COOKIE_NAME } from "@/lib/auth/auth-mode";
import { assertRegistrationsEnabled } from "@/lib/platform-policy/enforce";
import { PlatformPolicyError } from "@/lib/platform-policy/errors";
import { nativeSignInWithPassword } from "@/lib/auth/native/sign-in";
import {
  clearNativeSessionCookie,
  establishNativeSession,
} from "@/lib/auth/native/session";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  adminCreateAuthUser,
  adminUpdateAuthUserPassword,
} from "@/lib/auth/admin-users";
import { verifyPasswordResetToken } from "@/lib/auth/native/auth-tokens";
import { clearMustChangePasswordFlag } from "@/lib/auth/must-change-password";
import {
  enforceAuthRateLimit,
  getIpFromRequestHeaders,
} from "@/lib/rate-limit/enforce";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/presets";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export type SignInFormState = {
  error?: string;
  unconfirmed?: boolean;
  email?: string;
} | null;

async function clearLegacySupabaseAuthCookies() {
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith("sb-") && name.includes("auth-token")) {
      try {
        cookieStore.set(name, "", { path: "/", maxAge: 0 });
      } catch {}
    }
  }
}

export const signInAction = async (
  _prevState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const trimmedEmail = email.trim();
  const cookieStore = await cookies();
  const requestHeaders = await headers();

  const signInLimit = await enforceAuthRateLimit({
    scope: "signIn",
    bucketKey: `${trimmedEmail.toLowerCase()}|${getIpFromRequestHeaders(requestHeaders)}`,
    message: RATE_LIMIT_MESSAGES.signIn,
  });
  if (!signInLimit.ok) {
    return { error: signInLimit.message, email: trimmedEmail };
  }

  await clearNativeSessionCookie();
  await clearLegacySupabaseAuthCookies();

  const result = await nativeSignInWithPassword({ email, password });
  if (!result.ok) {
    return {
      error: result.error,
      email: trimmedEmail,
      unconfirmed: result.unconfirmed,
    };
  }

  const platformAllows2FA = await getAllowUserTwoFactor();
  const twoFactorEnabled = await storeGetTwoFactorEnabled(result.userId);

  if (platformAllows2FA && twoFactorEnabled) {
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await storeCreateTwoFactorSession({
      userId: result.userId,
      sessionToken,
      expiresAt,
    });
    cookieStore.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return redirect(`/verify-2fa?session=${sessionToken}`);
  }

  await establishNativeSession(result.userId);
  await writeAuditLog({
    pharmacyId: null,
    userId: result.userId,
    action: "LOGIN",
    tableName: "auth.sessions",
    newValues: { method: "password" },
    ...auditRequestMetadata({ headers: requestHeaders }),
  });
  redirect(POST_AUTH_ENTRY_PATH);
};

export const signUpAction = async (formData: FormData) => {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const full_name = ((formData.get("full_name") as string) || "").trim();

  try {
    await assertRegistrationsEnabled();
  } catch (error) {
    if (error instanceof PlatformPolicyError) {
      return encodedRedirect("error", "/sign-up", error.message);
    }
    throw error;
  }

  if (!email || !password) {
    return encodedRedirect("error", "/sign-up", "Email and password are required.");
  }
  if (password.length < 6) {
    return encodedRedirect("error", "/sign-up", "Password must be at least 6 characters.");
  }

  try {
    const { user } = await adminCreateAuthUser({
      email,
      password,
      fullName: full_name,
      emailConfirmed: false,
    });
    const result = await sendNativeSignupConfirmationEmail({
      userId: user.id,
      email,
      redirectTo: "/onboarding",
    });
    if (!result.ok) {
      return encodedRedirect("error", "/sign-up", result.error);
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not create account";
    return encodedRedirect("error", "/sign-up", message);
  }

  const params = new URLSearchParams({ email });
  redirect(`/verify-email?${params.toString()}`);
};

export const signInWithGoogleAction = async () => {
  const { isGoogleOAuthConfigured } = await import(
    "@/lib/auth/native/google-oauth"
  );
  if (!isGoogleOAuthConfigured()) {
    return encodedRedirect(
      "error",
      "/sign-in",
      "Google sign-in is not configured on this server.",
    );
  }
  redirect("/api/auth/google");
};

export const signOutAction = async () => {
  const user = await getAuthUser();
  const requestHeaders = await headers();
  await clearNativeSessionCookie();
  await clearLegacySupabaseAuthCookies();
  if (user) {
    await writeAuditLog({
      pharmacyId: null,
      userId: user.id,
      action: "LOGOUT",
      tableName: "auth.sessions",
      ...auditRequestMetadata({ headers: requestHeaders }),
    });
  }
  return redirect("/sign-in");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = (formData.get("email") as string)?.trim();
  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required.");
  }

  const result = await sendNativePasswordRecoveryEmail(email);
  if (!result.ok) {
    return encodedRedirect("error", "/forgot-password", result.error);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a password reset link.",
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

  const nativeToken = (formData.get("native_token") as string | null)?.trim();

  if (nativeToken) {
    const payload = await verifyPasswordResetToken(nativeToken);
    if (!payload) {
      return encodedRedirect(
        "error",
        RESET_PASSWORD_PATH,
        "Your reset link expired or is invalid. Request a new one from Forgot password.",
      );
    }
    await adminUpdateAuthUserPassword(payload.userId, password);
    await clearNativeSessionCookie();
    await writeAuditLog({
      pharmacyId: null,
      userId: payload.userId,
      action: "UPDATE",
      tableName: "auth.users",
      recordId: payload.userId,
      newValues: { securityEvent: "password_reset_completed" },
      ...auditRequestMetadata({ headers: await headers() }),
    });
    return encodedRedirect(
      "success",
      "/sign-in",
      "Your password was updated. Sign in with your new password.",
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return encodedRedirect(
      "error",
      RESET_PASSWORD_PATH,
      "Your reset link expired or is invalid. Request a new one from Forgot password.",
    );
  }

  await adminUpdateAuthUserPassword(user.id, password);
  await clearMustChangePasswordFlag(user.id, user.user_metadata);
  await clearNativeSessionCookie();
  await writeAuditLog({
    pharmacyId: null,
    userId: user.id,
    action: "UPDATE",
    tableName: "auth.users",
    recordId: user.id,
    newValues: { securityEvent: "password_reset_completed" },
    ...auditRequestMetadata({ headers: await headers() }),
  });
  return encodedRedirect(
    "success",
    "/sign-in",
    "Your password was updated. Sign in with your new password.",
  );
};
