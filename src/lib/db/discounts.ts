import { prisma } from "@/lib/db/prisma";

export type DiscountRow = {
  id: string;
  name: string;
  type: string;
  value: number;
  is_active: boolean | null;
};

function mapDiscount(row: {
  id: string;
  name: string;
  type: string;
  value: { toString(): string };
  is_active: boolean | null;
}): DiscountRow {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    value: Number(row.value),
    is_active: row.is_active,
  };
}

export async function listActiveDiscountsForPharmacyFromDb(
  pharmacyId: string,
): Promise<DiscountRow[]> {
  const rows = await prisma.discounts.findMany({
    where: { pharmacy_id: pharmacyId, is_active: true },
    orderBy: { name: "asc" },
  });
  return rows.map(mapDiscount);
}

export async function createDiscountFromDb(input: {
  pharmacyId: string;
  name: string;
  type: string;
  value: number;
}): Promise<DiscountRow> {
  const row = await prisma.discounts.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      type: input.type,
      value: input.value,
      is_active: true,
    },
  });
  return mapDiscount(row);
}
