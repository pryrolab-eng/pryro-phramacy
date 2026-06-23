import { storeEnsureWhitelistIp } from "@/lib/db/ip-whitelist-store";
import { invalidateIpWhitelistCache } from "@/lib/security/ip-whitelist-policy";

/** Insert client IP if not already on the pharmacy allowlist. */
export async function ensurePharmacyIpOnWhitelist(
  pharmacyId: string,
  clientIp: string,
  description = "Added automatically when enabling IP whitelist",
): Promise<void> {
  await storeEnsureWhitelistIp({
    pharmacyId,
    ipAddress: clientIp,
    description,
  });
  invalidateIpWhitelistCache(pharmacyId);
}

/** Insert client IP on platform allowlist (pharmacy_id IS NULL). */
export async function ensurePlatformIpOnWhitelist(
  clientIp: string,
  description = "Added automatically when enabling platform IP whitelist",
): Promise<void> {
  await storeEnsureWhitelistIp({
    pharmacyId: null,
    ipAddress: clientIp,
    description,
  });
  invalidateIpWhitelistCache(null);
}
