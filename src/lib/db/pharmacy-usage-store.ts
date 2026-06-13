import { countPharmacyUsage, type PharmacyUsageCounts } from "@/lib/db/pharmacy-usage";

export type { PharmacyUsageCounts };

export async function storeCountPharmacyUsage(
  pharmacyId: string,
): Promise<PharmacyUsageCounts> {
  return countPharmacyUsage(pharmacyId);
}
