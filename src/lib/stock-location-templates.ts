import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type StockLocationTemplate = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
};

export const STOCK_LOCATION_TEMPLATES_KEY = "stockLocationTemplates";

export const DEFAULT_STOCK_LOCATION_TEMPLATES: StockLocationTemplate[] = [
  { id: "1", name: "Main Store", description: "Primary location", is_active: true },
  { id: "2", name: "Branch", description: "Secondary location", is_active: true },
  { id: "3", name: "Cold Storage", description: "Temperature controlled", is_active: true },
  { id: "4", name: "Warehouse", description: "Bulk storage", is_active: true },
];

function parseTemplates(raw: unknown): StockLocationTemplate[] {
  if (!Array.isArray(raw)) return DEFAULT_STOCK_LOCATION_TEMPLATES;

  const templates = raw
    .map((item, index): StockLocationTemplate | null => {
      if (!item || typeof item !== "object") return null;
      const value = item as Record<string, unknown>;
      const name = typeof value.name === "string" ? value.name.trim() : "";
      if (!name) return null;
      return {
        id:
          typeof value.id === "string" && value.id.trim()
            ? value.id
            : String(index + 1),
        name,
        description:
          typeof value.description === "string" ? value.description : "",
        is_active:
          typeof value.is_active === "boolean" ? value.is_active : true,
      };
    })
    .filter((item): item is StockLocationTemplate => Boolean(item));

  return templates.length ? templates : DEFAULT_STOCK_LOCATION_TEMPLATES;
}

export async function getStockLocationTemplates(): Promise<StockLocationTemplate[]> {
  const row = await prisma.system_settings.findFirst({
    where: { pharmacy_id: null, setting_key: STOCK_LOCATION_TEMPLATES_KEY },
    select: { setting_value: true },
  });

  return row ? parseTemplates(row.setting_value) : DEFAULT_STOCK_LOCATION_TEMPLATES;
}

export async function saveStockLocationTemplates(
  templates: StockLocationTemplate[],
): Promise<void> {
  const existing = await prisma.system_settings.findFirst({
    where: { pharmacy_id: null, setting_key: STOCK_LOCATION_TEMPLATES_KEY },
    select: { id: true },
  });
  const value = templates as unknown as Prisma.InputJsonValue;

  if (existing) {
    await prisma.system_settings.update({
      where: { id: existing.id },
      data: { setting_value: value, updated_at: new Date() },
    });
    return;
  }

  await prisma.system_settings.create({
    data: {
      pharmacy_id: null,
      setting_key: STOCK_LOCATION_TEMPLATES_KEY,
      setting_value: value,
    },
  });
}

export async function appendStockLocationTemplate(input: {
  name: string;
  description?: string | null;
}): Promise<StockLocationTemplate> {
  const templates = await getStockLocationTemplates();
  const template = {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    is_active: true,
  };
  await saveStockLocationTemplates([...templates, template]);
  return template;
}
