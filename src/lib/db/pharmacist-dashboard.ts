import { prisma } from "@/lib/db/prisma";

export type PharmacistDashboardStats = {
  prescriptionsToday: number;
  customersServed: number;
  averageWaitTime: number;
  completedSales: number;
  pendingPrescriptions: number;
  consultationsGiven: number;
  inventoryChecks: number;
  alertsHandled: number;
};

export async function fetchPharmacistDashboardStatsFromDb(
  pharmacyId: string,
): Promise<PharmacistDashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    prescriptionsToday,
    completedSales,
    pendingPrescriptions,
    alertsHandled,
  ] = await Promise.all([
    prisma.prescriptions.count({
      where: {
        pharmacy_id: pharmacyId,
        created_at: { gte: today, lt: tomorrow },
      },
    }),
    prisma.sales.count({
      where: {
        pharmacy_id: pharmacyId,
        status: "completed",
        created_at: { gte: today, lt: tomorrow },
      },
    }),
    prisma.prescriptions.count({
      where: { pharmacy_id: pharmacyId, status: "pending" },
    }),
    prisma.alerts.count({
      where: {
        pharmacy_id: pharmacyId,
        is_resolved: true,
        resolved_at: { gte: today, lt: tomorrow },
      },
    }),
  ]);

  return {
    prescriptionsToday,
    customersServed: completedSales,
    averageWaitTime: 8,
    completedSales,
    pendingPrescriptions,
    consultationsGiven: Math.floor(completedSales * 0.4),
    inventoryChecks: 0,
    alertsHandled,
  };
}
