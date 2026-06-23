import { findAuthUserByEmailFromDb } from "@/lib/db/auth-credentials";
import { verifyPassword } from "@/lib/auth/native/password";
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/auth/invalid-credentials";

export type NativeSignInResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; error: string; unconfirmed?: boolean };

export async function nativeSignInWithPassword(input: {
  email: string;
  password: string;
}): Promise<NativeSignInResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
  }

  const row = await findAuthUserByEmailFromDb(email);
  if (!row) {
    return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
  }

  const valid = await verifyPassword(input.password, row.encrypted_password);
  if (!valid) {
    return { ok: false, error: INVALID_CREDENTIALS_MESSAGE };
  }

  if (!row.email_confirmed_at) {
    return {
      ok: false,
      unconfirmed: true,
      error:
        "Please confirm your email before signing in. Use Resend email in this notification.",
    };
  }

  return { ok: true, userId: row.id, email: row.email };
}
