import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const MUST_CHANGE_PASSWORD_METADATA_KEY = "must_change_password";

export const MIN_PASSWORD_LENGTH = 8;

export function userMustChangePassword(
  user: Pick<User, "user_metadata"> | null | undefined,
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
  admin: SupabaseClient,
  userId: string,
  existingMetadata: Record<string, unknown> | undefined,
  required: boolean,
) {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(existingMetadata ?? {}),
      [MUST_CHANGE_PASSWORD_METADATA_KEY]: required,
    },
  });
  if (error) throw error;
}

export async function clearMustChangePasswordFlag(
  admin: SupabaseClient,
  userId: string,
  existingMetadata: Record<string, unknown> | undefined,
) {
  await setMustChangePasswordFlag(admin, userId, existingMetadata, false);
}
