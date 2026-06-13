import { isPrismaConfigured } from "@/lib/db/is-prisma-configured";
import {
  createDiscountFromDb,
  listActiveDiscountsForPharmacyFromDb,
  type DiscountRow,
} from "@/lib/db/discounts";

function requirePrisma(): void {
  if (!isPrismaConfigured()) {
    throw new Error("DATABASE_URL is required for discounts (Prisma)");
  }
}

export type { DiscountRow };

export async function storeListActiveDiscounts(
  pharmacyId: string,
): Promise<DiscountRow[]> {
  requirePrisma();
  return listActiveDiscountsForPharmacyFromDb(pharmacyId);
}

export async function storeCreateDiscount(
  input: Parameters<typeof createDiscountFromDb>[0],
): Promise<DiscountRow> {
  requirePrisma();
  return createDiscountFromDb(input);
}
