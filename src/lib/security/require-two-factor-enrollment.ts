import { createClient } from "../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { getAllowUserTwoFactor } from "@/lib/platform-security-policy";

export type TwoFactorEnrollmentContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string | null };
  /** Authenticator app label in the QR code */
  issuer: string;
};

/**
 * Who may call 2FA setup/verify:
 * - Platform admins (always, for Admin → Settings)
 * - Pharmacy users when allowUserTwoFactor is on (Pharmacy → Settings)
 */
export async function requireTwoFactorEnrollment():
  Promise<
    | { ok: true; context: TwoFactorEnrollmentContext }
    | { ok: false; status: number; error: string }
  > {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const isPlatformAdmin = await resolveIsAppPlatformAdmin(
    supabase,
    user.id,
    null,
  );

  if (isPlatformAdmin) {
    return {
      ok: true,
      context: { supabase, user, issuer: "Pryrox Admin" },
    };
  }

  const platformAllows = await getAllowUserTwoFactor(supabase);
  if (!platformAllows) {
    return {
      ok: false,
      status: 403,
      error:
        "Two-factor authentication is disabled by the platform administrator.",
    };
  }

  return {
    ok: true,
    context: { supabase, user, issuer: "Pryrox Pharmacy" },
  };
}
