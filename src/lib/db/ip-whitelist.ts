import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type IpWhitelistRecord = {
  id: string;
  pharmacy_id: string | null;
  ip_address: string;
  description: string | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function toRecord(row: {
  id: string;
  pharmacy_id: string | null;
  ip_address: string;
  description: string | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}): IpWhitelistRecord {
  return row;
}

export async function listActiveWhitelistIpAddresses(
  pharmacyId: string | null,
): Promise<string[]> {
  const rows = await prisma.ip_whitelist.findMany({
    where: {
      is_active: true,
      pharmacy_id: pharmacyId,
    },
    select: { ip_address: true },
  });

  return rows
    .map((row) => row.ip_address.trim())
    .filter(Boolean);
}

export async function listWhitelistEntries(
  pharmacyId: string | null,
  options?: { activeOnly?: boolean },
): Promise<IpWhitelistRecord[]> {
  const rows = await prisma.ip_whitelist.findMany({
    where: {
      pharmacy_id: pharmacyId,
      ...(options?.activeOnly ? { is_active: true } : {}),
    },
    orderBy: { created_at: "desc" },
  });

  return rows.map(toRecord);
}

export async function findWhitelistEntry(
  pharmacyId: string | null,
  ipAddress: string,
): Promise<IpWhitelistRecord | null> {
  const row = await prisma.ip_whitelist.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      ip_address: ipAddress,
    },
  });

  return row ? toRecord(row) : null;
}

export async function createWhitelistEntry(input: {
  pharmacyId: string | null;
  ipAddress: string;
  description?: string;
  isActive?: boolean;
}): Promise<IpWhitelistRecord> {
  const row = await prisma.ip_whitelist.create({
    data: {
      pharmacy_id: input.pharmacyId,
      ip_address: input.ipAddress,
      description: input.description ?? "",
      is_active: input.isActive ?? true,
    },
  });

  return toRecord(row);
}

export async function deleteWhitelistEntry(
  id: string,
  pharmacyId: string | null,
): Promise<void> {
  await prisma.ip_whitelist.deleteMany({
    where: {
      id,
      pharmacy_id: pharmacyId,
    },
  });
}

export async function upsertPharmacySecuritySettingFromDb(
  pharmacyId: string,
  settingValue: Record<string, unknown>,
): Promise<void> {
  await prisma.pharmacy_settings.upsert({
    where: {
      pharmacy_id_setting_key: {
        pharmacy_id: pharmacyId,
        setting_key: "security",
      },
    },
    create: {
      pharmacy_id: pharmacyId,
      setting_key: "security",
      setting_value: settingValue as Prisma.InputJsonValue,
    },
    update: {
      setting_value: settingValue as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  });
}

export async function getPharmacySecuritySetting(
  pharmacyId: string,
): Promise<{ ip_whitelist_enabled?: boolean } | null> {
  const row = await prisma.pharmacy_settings.findUnique({
    where: {
      pharmacy_id_setting_key: {
        pharmacy_id: pharmacyId,
        setting_key: "security",
      },
    },
    select: { setting_value: true },
  });

  if (!row?.setting_value || typeof row.setting_value !== "object") {
    return null;
  }

  return row.setting_value as { ip_whitelist_enabled?: boolean };
}

export async function getPlatformIpWhitelistEnabled(): Promise<boolean | null> {
  const row = await prisma.system_settings.findFirst({
    where: {
      pharmacy_id: null,
      setting_key: "ipWhitelistEnabled",
    },
    select: { setting_value: true },
  });

  if (row?.setting_value === undefined || row.setting_value === null) {
    return null;
  }

  if (typeof row.setting_value === "boolean") {
    return row.setting_value;
  }

  if (
    typeof row.setting_value === "object" &&
    row.setting_value !== null &&
    "enabled" in row.setting_value
  ) {
    return (row.setting_value as { enabled?: boolean }).enabled === true;
  }

  return null;
}
