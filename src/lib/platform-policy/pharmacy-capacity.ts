import { prisma } from "@/lib/db/prisma";
import { getMaxPharmacies } from "@/lib/platform-settings";
import { PlatformPolicyError } from "./errors";

export async function countPharmacies(): Promise<number> {
  return prisma.pharmacies.count();
}

export async function assertCanCreatePharmacy(): Promise<void> {
  const max = await getMaxPharmacies();
  if (max <= 0) {
    throw new PlatformPolicyError(
      "New pharmacies cannot be created at this time.",
      "max_pharmacies_reached",
    );
  }

  const current = await countPharmacies();
  if (current >= max) {
    throw new PlatformPolicyError(
      `Platform pharmacy limit reached (${max}). Contact support to increase capacity.`,
      "max_pharmacies_reached",
    );
  }
}
