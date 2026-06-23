import { prisma } from "@/lib/db/prisma";
import { storeListInventory } from "@/lib/db/inventory-store";

export type IntegrationPharmacySummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  status: string | null;
  subscriptionPlan: string | null;
  createdAt: string | null;
};

export type IntegrationPharmacyDetail = IntegrationPharmacySummary & {
  address: string | null;
  licenseNumber: string | null;
  branches: Array<{
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
  }>;
};

function mapPharmacySummary(row: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  status: string | null;
  subscription_plan: string | null;
  created_at: Date | null;
}): IntegrationPharmacySummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    province: row.province,
    status: row.status,
    subscriptionPlan: row.subscription_plan,
    createdAt: row.created_at?.toISOString() ?? null,
  };
}

export async function listIntegrationPharmacies(options?: {
  activeOnly?: boolean;
}): Promise<IntegrationPharmacySummary[]> {
  const rows = await prisma.pharmacies.findMany({
    where: options?.activeOnly !== false ? { status: "active" } : undefined,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      province: true,
      status: true,
      subscription_plan: true,
      created_at: true,
    },
  });
  return rows.map(mapPharmacySummary);
}

export async function getIntegrationPharmacyDetail(
  pharmacyId: string,
): Promise<IntegrationPharmacyDetail | null> {
  const row = await prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      province: true,
      address: true,
      license_number: true,
      status: true,
      subscription_plan: true,
      created_at: true,
      branches: {
        where: { is_active: true },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          is_active: true,
        },
      },
    },
  });

  if (!row) return null;

  return {
    ...mapPharmacySummary(row),
    address: row.address,
    licenseNumber: row.license_number,
    branches: row.branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      isActive: b.is_active ?? false,
    })),
  };
}

export async function pharmacyExists(pharmacyId: string): Promise<boolean> {
  const count = await prisma.pharmacies.count({ where: { id: pharmacyId } });
  return count > 0;
}

export async function listIntegrationInventory(
  pharmacyId: string,
  branchId?: string,
) {
  const items = await storeListInventory(pharmacyId, branchId);
  return items.map((item) => ({
    id: item.id,
    medicationId: item.medicationId,
    name: item.name,
    category: item.category,
    stock: item.stock,
    minStock: item.minStock,
    price: item.price,
    expiryDate: item.expiryDate,
    batchNumber: item.batchNumber,
  }));
}

export async function listIntegrationSales(input: {
  pharmacyId: string;
  from?: Date;
  to?: Date;
  limit: number;
}) {
  const sales = await prisma.sales.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      ...(input.from || input.to
        ? {
            created_at: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { created_at: "desc" },
    take: input.limit,
    select: {
      id: true,
      receipt_number: true,
      customer_name: true,
      customer_phone: true,
      total_amount: true,
      payment_method: true,
      status: true,
      branch_id: true,
      created_at: true,
    },
  });

  const saleIds = sales.map((s) => s.id);
  const counts =
    saleIds.length > 0
      ? await prisma.sale_items.groupBy({
          by: ["sale_id"],
          where: { sale_id: { in: saleIds } },
          _count: { _all: true },
        })
      : [];
  const countBySale = new Map(counts.map((c) => [c.sale_id, c._count._all]));

  return sales.map((sale) => ({
    id: sale.id,
    receiptNumber: sale.receipt_number,
    customerName: sale.customer_name,
    customerPhone: sale.customer_phone,
    totalAmount: Number(sale.total_amount ?? 0),
    paymentMethod: sale.payment_method,
    status: sale.status,
    branchId: sale.branch_id,
    itemCount: countBySale.get(sale.id) ?? 0,
    createdAt: sale.created_at?.toISOString() ?? null,
  }));
}
