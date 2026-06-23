import { parseBooleanSetting } from "@/lib/platform-security-policy";
import {
  storeGetPharmacyIpWhitelistEnabled,
  storeGetPlatformIpWhitelistEnabled,
  storeListActiveWhitelistIps,
} from "@/lib/db/ip-whitelist-store";
import { ipMatchesAllowlist } from "@/lib/security/ip-address";

export type IpWhitelistPolicy = {
  enabled: boolean;
  ips: string[];
};

const CACHE_TTL_MS = 60_000;

type CacheEntry = { policy: IpWhitelistPolicy; expiresAt: number };

const platformCache: { entry: CacheEntry | null } = { entry: null };
const pharmacyCache = new Map<string, CacheEntry>();

export function invalidateIpWhitelistCache(pharmacyId?: string | null): void {
  if (pharmacyId === undefined) {
    platformCache.entry = null;
    pharmacyCache.clear();
    return;
  }
  if (pharmacyId === null) {
    platformCache.entry = null;
    return;
  }
  pharmacyCache.delete(pharmacyId);
}

export async function getPlatformIpWhitelistPolicy(): Promise<IpWhitelistPolicy> {
  const now = Date.now();
  if (platformCache.entry && platformCache.entry.expiresAt > now) {
    return platformCache.entry.policy;
  }

  const settingValue = await storeGetPlatformIpWhitelistEnabled();
  const enabled = parseBooleanSetting(settingValue, false);
  const ips = await storeListActiveWhitelistIps(null);

  const policy = { enabled, ips };
  platformCache.entry = { policy, expiresAt: now + CACHE_TTL_MS };
  return policy;
}

export async function getPharmacyIpWhitelistPolicy(
  pharmacyId: string,
): Promise<IpWhitelistPolicy> {
  const now = Date.now();
  const cached = pharmacyCache.get(pharmacyId);
  if (cached && cached.expiresAt > now) {
    return cached.policy;
  }

  const enabled = await storeGetPharmacyIpWhitelistEnabled(pharmacyId);
  const ips = await storeListActiveWhitelistIps(pharmacyId);

  const policy = { enabled, ips };
  pharmacyCache.set(pharmacyId, { policy, expiresAt: now + CACHE_TTL_MS });
  return policy;
}

export function isIpAllowedByPolicy(
  clientIp: string,
  policy: IpWhitelistPolicy,
): boolean {
  if (!policy.enabled) return true;
  if (policy.ips.length === 0) return true;
  if (!clientIp) return false;
  return ipMatchesAllowlist(clientIp, policy.ips);
}

/** When enforcement is active (production default). */
export function shouldEnforceIpWhitelist(): boolean {
  const flag = process.env.IP_WHITELIST_ENFORCE;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return process.env.NODE_ENV === "production";
}
