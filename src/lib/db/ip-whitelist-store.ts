import {
  createWhitelistEntry,
  deleteWhitelistEntry,
  findWhitelistEntry,
  getPharmacySecuritySetting,
  getPlatformIpWhitelistEnabled,
  upsertPharmacySecuritySettingFromDb,
  listActiveWhitelistIpAddresses,
  listWhitelistEntries,
  type IpWhitelistRecord,
} from "@/lib/db/ip-whitelist";

export type { IpWhitelistRecord };

export async function storeListActiveWhitelistIps(
  pharmacyId: string | null,
): Promise<string[]> {
  return listActiveWhitelistIpAddresses(pharmacyId);
}

export async function storeListWhitelistEntries(
  pharmacyId: string | null,
  options?: { activeOnly?: boolean },
): Promise<IpWhitelistRecord[]> {
  return listWhitelistEntries(pharmacyId, options);
}

export async function storeEnsureWhitelistIp(input: {
  pharmacyId: string | null;
  ipAddress: string;
  description?: string;
}): Promise<void> {
  const ip = input.ipAddress.trim();
  if (!ip) return;

  const existing = await findWhitelistEntry(input.pharmacyId, ip);
  if (existing) return;

  await createWhitelistEntry({
    pharmacyId: input.pharmacyId,
    ipAddress: ip,
    description: input.description,
  });
}

export async function storeCreateWhitelistEntry(input: {
  pharmacyId: string | null;
  ipAddress: string;
  description?: string;
}): Promise<IpWhitelistRecord> {
  return createWhitelistEntry({
    pharmacyId: input.pharmacyId,
    ipAddress: input.ipAddress,
    description: input.description,
  });
}

export async function storeDeleteWhitelistEntry(
  id: string,
  pharmacyId: string | null,
): Promise<void> {
  await deleteWhitelistEntry(id, pharmacyId);
}

export async function storeGetPharmacyIpWhitelistEnabled(
  pharmacyId: string,
): Promise<boolean> {
  const value = await getPharmacySecuritySetting(pharmacyId);
  return value?.ip_whitelist_enabled === true;
}

export async function storeGetPlatformIpWhitelistEnabled(): Promise<boolean | null> {
  return getPlatformIpWhitelistEnabled();
}

export async function storeUpsertPharmacySecuritySetting(
  pharmacyId: string,
  settingValue: Record<string, unknown>,
): Promise<void> {
  await upsertPharmacySecuritySettingFromDb(pharmacyId, settingValue);
}
