import { prisma } from "@/lib/db/prisma";

export type PharmacyUsageCounts = {
  activeUsers: number;
  activeBranches: number;
};

export async function countPharmacyUsage(
  pharmacyId: string,
): Promise<PharmacyUsageCounts> {
  const [activeUsers, activeBranches] = await Promise.all([
    prisma.pharmacy_users.count({
      where: { pharmacy_id: pharmacyId, is_active: true },
    }),
    prisma.branches.count({
      where: { pharmacy_id: pharmacyId, is_active: true },
    }),
  ]);

  return { activeUsers, activeBranches };
}
