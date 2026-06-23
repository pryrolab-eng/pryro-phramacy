import { prisma } from "@/lib/db/prisma";

const CURRENCY_KEY = "currency";
const LANGUAGE_KEY = "language";

const DEFAULT_CURRENCY = "RWF";
const DEFAULT_LANGUAGE = "en";

function readStringSetting(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

export async function getPharmacyLocaleFromDb(pharmacyId: string): Promise<{
  currency: string;
  language: string;
}> {
  const rows = await prisma.pharmacy_settings.findMany({
    where: {
      pharmacy_id: pharmacyId,
      setting_key: { in: [CURRENCY_KEY, LANGUAGE_KEY] },
    },
    select: { setting_key: true, setting_value: true },
  });

  let currency = DEFAULT_CURRENCY;
  let language = DEFAULT_LANGUAGE;

  for (const row of rows) {
    if (row.setting_key === CURRENCY_KEY) {
      currency = readStringSetting(row.setting_value, DEFAULT_CURRENCY);
    }
    if (row.setting_key === LANGUAGE_KEY) {
      language = readStringSetting(row.setting_value, DEFAULT_LANGUAGE);
    }
  }

  return { currency, language };
}

async function upsertLocaleKey(
  pharmacyId: string,
  key: string,
  value: string,
): Promise<void> {
  await prisma.pharmacy_settings.upsert({
    where: {
      pharmacy_id_setting_key: {
        pharmacy_id: pharmacyId,
        setting_key: key,
      },
    },
    create: {
      pharmacy_id: pharmacyId,
      setting_key: key,
      setting_value: value,
    },
    update: {
      setting_value: value,
      updated_at: new Date(),
    },
  });
}

export async function upsertPharmacyLocaleFromDb(
  pharmacyId: string,
  input: { currency?: string; language?: string },
): Promise<void> {
  if (input.currency) {
    await upsertLocaleKey(pharmacyId, CURRENCY_KEY, input.currency);
  }
  if (input.language) {
    await upsertLocaleKey(pharmacyId, LANGUAGE_KEY, input.language);
  }
}
