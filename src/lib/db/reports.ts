import { prisma } from "@/lib/db/prisma";

export type ReportScope = {
  pharmacyId: string;
  from?: string;
  to?: string;
  branchId?: string;
};

function salesWhere(scope: ReportScope, range?: { from: string; to: string }) {
  return {
    pharmacy_id: scope.pharmacyId,
    ...(scope.branchId ? { branch_id: scope.branchId } : {}),
    ...(range
      ? {
          created_at: {
            gte: new Date(range.from),
            lte: new Date(range.to),
          },
        }
      : {}),
  };
}

function decimal(value: { toString(): string } | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

export async function fetchSalesReportRows(
  scope: ReportScope,
  range: { from: string; to: string },
) {
  const rows = await prisma.sales.findMany({
    where: salesWhere(scope, range),
    select: {
      total_amount: true,
      created_at: true,
      id: true,
      customer_name: true,
      payment_method: true,
    },
    orderBy: { created_at: "asc" },
  });

  return rows.map((row) => ({
    total_amount: decimal(row.total_amount),
    created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
    id: row.id,
    customer_name: row.customer_name,
    payment_method: row.payment_method,
  }));
}

export async function fetchSaleItemsReportRows(
  scope: ReportScope,
  range: { from: string; to: string },
) {
  const rows = await prisma.sale_items.findMany({
    where: {
      sales: salesWhere(scope, range),
    },
    select: {
      medication_name: true,
      total_price: true,
      quantity: true,
    },
  });

  return rows.map((row) => ({
    medication_name: row.medication_name,
    total_price: decimal(row.total_price),
    quantity: row.quantity,
  }));
}

export async function fetchInventoryReportRows(
  pharmacyId: string,
  since: Date,
) {
  const rows = await prisma.inventory.findMany({
    where: {
      pharmacy_id: pharmacyId,
      created_at: { gte: since },
      medications: { pharmacy_id: pharmacyId },
    },
    select: {
      quantity_in_stock: true,
      minimum_stock_level: true,
      expiry_date: true,
      created_at: true,
    },
    orderBy: { created_at: "asc" },
  });

  return rows.map((row) => ({
    quantity_in_stock: row.quantity_in_stock,
    minimum_stock_level: row.minimum_stock_level,
    expiry_date: row.expiry_date?.toISOString().slice(0, 10) ?? null,
    created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function fetchTodaySalesTotal(
  scope: ReportScope,
  todayIso: string,
) {
  const rows = await prisma.sales.findMany({
    where: {
      pharmacy_id: scope.pharmacyId,
      ...(scope.branchId ? { branch_id: scope.branchId } : {}),
      created_at: { gte: new Date(`${todayIso}T00:00:00.000Z`) },
    },
    select: { total_amount: true },
  });

  return rows.reduce((sum, row) => sum + decimal(row.total_amount), 0);
}

export async function fetchRangeSalesRows(
  scope: ReportScope,
  range: { from: string; to: string },
) {
  const rows = await prisma.sales.findMany({
    where: salesWhere(scope, range),
    select: {
      total_amount: true,
      id: true,
      customer_name: true,
    },
  });

  return rows.map((row) => ({
    total_amount: decimal(row.total_amount),
    id: row.id,
    customer_name: row.customer_name,
  }));
}

export async function countMedicationsForPharmacy(pharmacyId: string) {
  return prisma.medications.count({ where: { pharmacy_id: pharmacyId } });
}

export async function countActiveStaffForPharmacy(pharmacyId: string) {
  return prisma.pharmacy_users.count({
    where: { pharmacy_id: pharmacyId, is_active: true },
  });
}

export async function fetchSalesSince(
  scope: ReportScope,
  since: Date,
) {
  const rows = await prisma.sales.findMany({
    where: {
      pharmacy_id: scope.pharmacyId,
      ...(scope.branchId ? { branch_id: scope.branchId } : {}),
      created_at: { gte: since },
    },
    select: { total_amount: true, created_at: true },
  });

  return rows.map((row) => ({
    total_amount: decimal(row.total_amount),
    created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function fetchInventoryChartRows(pharmacyId: string) {
  const rows = await prisma.inventory.findMany({
    where: {
      pharmacy_id: pharmacyId,
      medications: { pharmacy_id: pharmacyId },
    },
    select: {
      quantity_in_stock: true,
      minimum_stock_level: true,
      created_at: true,
      updated_at: true,
    },
  });

  return rows.map((row) => ({
    quantity_in_stock: row.quantity_in_stock,
    minimum_stock_level: row.minimum_stock_level,
    created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
    updated_at: row.updated_at?.toISOString() ?? null,
  }));
}

export async function fetchCategorySaleItemRows(scope: ReportScope) {
  const rows = await prisma.sale_items.findMany({
    where: {
      sales: {
        pharmacy_id: scope.pharmacyId,
        ...(scope.branchId ? { branch_id: scope.branchId } : {}),
      },
    },
    select: {
      total_price: true,
      inventory: {
        select: {
          medications: { select: { category: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    total_price: decimal(row.total_price),
    category: row.inventory?.medications?.category ?? "other",
  }));
}

export async function fetchWeeklySaleItemRows(
  scope: ReportScope,
  since: Date,
) {
  const rows = await prisma.sale_items.findMany({
    where: {
      sales: {
        pharmacy_id: scope.pharmacyId,
        ...(scope.branchId ? { branch_id: scope.branchId } : {}),
        created_at: { gte: since },
      },
    },
    select: {
      total_price: true,
      sales: { select: { created_at: true } },
      inventory: {
        select: {
          medications: { select: { category: true } },
        },
      },
    },
  });

  return rows
    .filter((row) => row.sales?.created_at)
    .map((row) => ({
      total_price: decimal(row.total_price),
      created_at: row.sales!.created_at!.toISOString(),
      category: row.inventory?.medications?.category ?? null,
    }));
}

export async function fetchLegacyDashboardStats(pharmacyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const [todayAgg, lowStockCount, expiringCount, activeStaff] = await Promise.all([
    prisma.sales.aggregate({
      where: {
        pharmacy_id: pharmacyId,
        created_at: { gte: today, lt: tomorrow },
      },
      _count: { id: true },
      _sum: { total_amount: true },
    }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM inventory
      WHERE pharmacy_id = ${pharmacyId}::uuid
        AND quantity_in_stock <= minimum_stock_level
    `,
    prisma.inventory.count({
      where: {
        pharmacy_id: pharmacyId,
        expiry_date: { lte: thirtyDays },
      },
    }),
    prisma.pharmacy_users.count({
      where: { pharmacy_id: pharmacyId, is_active: true },
    }),
  ]);

  return {
    pharmacy_id: pharmacyId,
    total_sales_today: todayAgg._count.id,
    total_revenue_today: decimal(todayAgg._sum.total_amount),
    low_stock_items: Number(lowStockCount[0]?.count ?? 0),
    expiring_items: expiringCount,
    active_staff: activeStaff,
  };
}

export async function fetchLegacyInventoryAlerts(pharmacyId: string) {
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await prisma.inventory.findMany({
    where: {
      pharmacy_id: pharmacyId,
      OR: [
        { expiry_date: { lte: thirtyDays } },
      ],
    },
    include: {
      medications: { select: { name: true } },
    },
    take: 50,
  });

  return rows
    .filter((row) => {
      const qty = row.quantity_in_stock ?? 0;
      const min = row.minimum_stock_level ?? 0;
      const isLow = qty <= min;
      const expiry = row.expiry_date;
      const isExpiring =
        expiry != null && expiry <= thirtyDays;
      return isLow || isExpiring;
    })
    .slice(0, 10)
    .map((row) => {
      const qty = row.quantity_in_stock ?? 0;
      const min = row.minimum_stock_level ?? 0;
      const expiry = row.expiry_date;
      let alert_type: "low_stock" | "expiring_soon" | "expired" | "normal" =
        "normal";
      if (qty <= min) {
        alert_type = "low_stock";
      } else if (expiry && expiry < today) {
        alert_type = "expired";
      } else if (expiry && expiry <= thirtyDays) {
        alert_type = "expiring_soon";
      }

      return {
        pharmacy_id: pharmacyId,
        medication_name: row.medications?.name ?? "Unknown",
        quantity_in_stock: qty,
        minimum_stock_level: min,
        expiry_date: expiry?.toISOString().slice(0, 10) ?? null,
        alert_type,
      };
    });
}

export type DailyCloseSaleRow = {
  id: string;
  total_amount: number;
  payment_method: string | null;
};

export async function fetchDailyCloseSalesFromDb(
  pharmacyId: string,
  branchId: string,
  start: Date,
  end: Date,
): Promise<DailyCloseSaleRow[]> {
  const rows = await prisma.sales.findMany({
    where: {
      pharmacy_id: pharmacyId,
      branch_id: branchId,
      status: "completed",
      created_at: { gte: start, lte: end },
    },
    select: {
      id: true,
      total_amount: true,
      payment_method: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    total_amount: decimal(row.total_amount),
    payment_method: row.payment_method,
  }));
}

export async function fetchRecentPosSalesRows(
  scope: ReportScope,
  limit = 5,
) {
  const rows = await prisma.sales.findMany({
    where: {
      pharmacy_id: scope.pharmacyId,
      ...(scope.branchId ? { branch_id: scope.branchId } : {}),
    },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      customer_name: true,
      total_amount: true,
      payment_method: true,
      created_at: true,
      sale_items: { select: { id: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    customer: row.customer_name || "Walk-in Customer",
    amount: decimal(row.total_amount),
    items: row.sale_items.length || 1,
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    payment_method:
      row.payment_method === "mobile_money"
        ? "Mobile Money"
        : row.payment_method === "cash"
          ? "Cash"
          : row.payment_method === "insurance"
            ? "Insurance"
            : "Card",
  }));
}

export async function fetchRecentSalesWithItems(pharmacyId: string) {
  const rows = await prisma.sales.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      id: true,
      customer_name: true,
      total_amount: true,
      payment_method: true,
      created_at: true,
      sale_items: {
        select: {
          medication_name: true,
          quantity: true,
          total_price: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    customer_name: row.customer_name,
    total_amount: decimal(row.total_amount),
    payment_method: row.payment_method,
    created_at: row.created_at?.toISOString() ?? null,
    sale_items: row.sale_items.map((item) => ({
      medication_name: item.medication_name,
      quantity: item.quantity,
      total_price: decimal(item.total_price),
    })),
  }));
}
