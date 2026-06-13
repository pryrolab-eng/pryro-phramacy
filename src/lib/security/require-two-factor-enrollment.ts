import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { getAllowUserTwoFactor } from "@/lib/platform-security-policy";

export type TwoFactorEnrollmentContext = {
  user: { id: string; email?: string | null };
  /** Authenticator app label in the QR code */
  issuer: string;
};

/**
 * Who may call 2FA setup/verify:
 * - Platform admins (always, for Admin → Settings)
 * - Pharmacy users when allowUserTwoFactor is on (Pharmacy → Settings)
 */
export async function requireTwoFactorEnrollment(): Promise<
  | { ok: true; context: TwoFactorEnrollmentContext }
  | { ok: false; status: number; error: string }
> {
  const user = await getAuthUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);

  if (isPlatformAdmin) {
    return {
      ok: true,
      context: { user, issuer: "Pryrox Admin" },
    };
  }

  const platformAllows = await getAllowUserTwoFactor();
  if (!platformAllows) {
    return {
      ok: false,
      status: 403,
      error: "Two-factor authentication is disabled by the platform administrator.",
    };
  }

  return {
    ok: true,
    context: { user, issuer: "Pryrox Pharmacy" },
  };
}
