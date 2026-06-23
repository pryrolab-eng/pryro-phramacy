import { storeGetIsPlatformAdmin } from "@/lib/db/public-users-store";

/** Legacy: platform staff was modeled as pharmacy_users.role = admin (or superadmin if ever used). */
export function isLegacyPharmacyPlatformRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

/**
 * Pryrox platform operator: /superadmin and broad RLS via is_admin / is_superadmin.
 * Prefer public.users.is_platform_admin; still accepts legacy pharmacy_users admin rows.
 */
export async function resolveIsAppPlatformAdmin(
  userId: string,
  primaryPharmacyRole?: string | null,
): Promise<boolean> {
  if (isLegacyPharmacyPlatformRole(primaryPharmacyRole)) {
    return true;
  }
  return storeGetIsPlatformAdmin(userId);
}
