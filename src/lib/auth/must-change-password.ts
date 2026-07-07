import { adminUpdateAuthUserMetadata } from "@/lib/auth/admin-users";
import { findAuthUserByIdFromDb } from "@/lib/db/auth-credentials";

export const MUST_CHANGE_PASSWORD_METADATA_KEY = "must_change_password";

export const MIN_PASSWORD_LENGTH = 8;

type UserWithMetadata = {
  user_metadata?: Record<string, unknown>;
};

export function userMustChangePassword(
  user: UserWithMetadata | null | undefined,
): boolean {
  return user?.user_metadata?.[MUST_CHANGE_PASSWORD_METADATA_KEY] === true;
}

export function staffInviteUserMetadata(options: {
  full_name: string;
  phone?: string | null;
}) {
  return {
    full_name: options.full_name,
    phone: options.phone ?? undefined,
    [MUST_CHANGE_PASSWORD_METADATA_KEY]: true,
  };
}

export function validateNewPasswordPair(
  newPassword: string,
  confirmPassword: string,
): string | null {
  const next = newPassword.trim();
  const confirm = confirmPassword.trim();
  if (!next || !confirm) {
    return "Enter and confirm your new password.";
  }
  if (next.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (next !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}

export async function setMustChangePasswordFlag(
  userId: string,
  _existingMetadata: Record<string, unknown> | undefined,
  required: boolean,
) {
  await adminUpdateAuthUserMetadata(userId, {
    [MUST_CHANGE_PASSWORD_METADATA_KEY]: required,
  });
}

export async function clearMustChangePasswordFlag(
  userId: string,
  existingMetadata: Record<string, unknown> | undefined,
) {
  await setMustChangePasswordFlag(userId, existingMetadata, false);
}

/** Read the flag from DB — avoids stale in-memory session user metadata. */
export async function readMustChangePasswordFromDb(
  userId: string,
): Promise<boolean> {
  const row = await findAuthUserByIdFromDb(userId);
  return userMustChangePassword({
    user_metadata: row?.raw_user_meta_data ?? {},
  });
}
