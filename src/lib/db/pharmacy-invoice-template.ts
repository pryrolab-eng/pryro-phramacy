import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const DEFAULT_INVOICE_TEMPLATE = {
  showLogo: true,
  headerFields: ["pharmacyName", "pharmacyAddress", "pharmacyPhone", "date"],
  patientFields: [
    "beneficialNumber",
    "beneficialName",
    "telephone",
    "insuranceTIN",
  ],
  productFields: ["name", "batch", "expiryDate", "quantity", "price", "total"],
  showTax: true,
  showInsuranceSplit: true,
  footerText: "Thank you for your business",
};

const SETTING_KEY = "invoice_template";

export type InvoiceTemplateConfig = typeof DEFAULT_INVOICE_TEMPLATE;

function parseTemplate(value: unknown): InvoiceTemplateConfig {
  if (!value || typeof value !== "object") return DEFAULT_INVOICE_TEMPLATE;
  return { ...DEFAULT_INVOICE_TEMPLATE, ...(value as Record<string, unknown>) };
}

export async function getPharmacyInvoiceTemplateFromDb(
  pharmacyId: string,
): Promise<InvoiceTemplateConfig> {
  const row = await prisma.pharmacy_settings.findUnique({
    where: {
      pharmacy_id_setting_key: {
        pharmacy_id: pharmacyId,
        setting_key: SETTING_KEY,
      },
    },
    select: { setting_value: true },
  });

  return parseTemplate(row?.setting_value);
}

export async function upsertPharmacyInvoiceTemplateFromDb(
  pharmacyId: string,
  template: InvoiceTemplateConfig,
): Promise<InvoiceTemplateConfig> {
  const row = await prisma.pharmacy_settings.upsert({
    where: {
      pharmacy_id_setting_key: {
        pharmacy_id: pharmacyId,
        setting_key: SETTING_KEY,
      },
    },
    create: {
      pharmacy_id: pharmacyId,
      setting_key: SETTING_KEY,
      setting_value: template as Prisma.InputJsonValue,
    },
    update: {
      setting_value: template as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
    select: { setting_value: true },
  });

  return parseTemplate(row.setting_value);
}
