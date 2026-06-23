import { isPrismaConfigured } from "@/lib/db/is-prisma-configured";
import { listInventoryAlertsForPharmacy } from "@/lib/db/inventory";

export type DashboardAlertRow = {
  id: string;
  product: string;
  current_stock: number;
  min_stock: number;
  category: string;
  expires_in: number;
};

function requirePrisma(): void {
  if (!isPrismaConfigured()) {
    throw new Error("DATABASE_URL is required for alerts (Prisma)");
  }
}

export async function storeListDashboardAlerts(
  pharmacyId: string,
): Promise<DashboardAlertRow[]> {
  requirePrisma();
  const rows = await listInventoryAlertsForPharmacy(pharmacyId);
  const today = new Date();

  return rows
    .filter(
      (item) =>
        (item.quantity_in_stock ?? 0) <
        (item.minimum_stock_level ?? 0) * 1.5,
    )
    .slice(0, 50)
    .map((item) => {
      const expiryDate = item.expiry_date;
      const daysToExpiry = expiryDate
        ? Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 0;

      return {
        id: item.id,
        product: item.medications?.name ?? "Unknown Product",
        current_stock: item.quantity_in_stock ?? 0,
        min_stock: item.minimum_stock_level ?? 0,
        category: item.medications?.category ?? "General",
        expires_in: daysToExpiry > 0 ? daysToExpiry : 0,
      };
    });
}
