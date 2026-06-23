import type { cashier_shift_status } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CashierShiftRow = {
  id: string;
  pharmacy_id: string;
  branch_id: string;
  cashier_id: string;
  status: cashier_shift_status;
  opening_cash: number;
  expected_cash: number | null;
  actual_cash: number | null;
  cash_variance: number | null;
  total_sales: number | null;
  total_refunds: number | null;
  transaction_count: number | null;
  opened_at: Date;
  closed_at: Date | null;
  close_notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type OpenCashierShiftRow = {
  id: string;
  total_sales: number | null;
  total_refunds: number | null;
  transaction_count: number | null;
  opened_at: string;
  opening_cash: number;
};

export type ShiftSalesSummary = {
  totalSales: number;
  cashSales: number;
  transactionCount: number;
};

function toNumber(value: unknown): number {
  if (value == null) return 0;
  return Number(value) || 0;
}

function mapShift(row: {
  id: string;
  pharmacy_id: string;
  branch_id: string;
  cashier_id: string;
  status: cashier_shift_status;
  opening_cash: unknown;
  expected_cash: unknown;
  actual_cash: unknown;
  cash_variance: unknown;
  total_sales: unknown;
  total_refunds: unknown;
  transaction_count: number | null;
  opened_at: Date;
  closed_at: Date | null;
  close_notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}): CashierShiftRow {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    branch_id: row.branch_id,
    cashier_id: row.cashier_id,
    status: row.status,
    opening_cash: toNumber(row.opening_cash),
    expected_cash: row.expected_cash != null ? toNumber(row.expected_cash) : null,
    actual_cash: row.actual_cash != null ? toNumber(row.actual_cash) : null,
    cash_variance: row.cash_variance != null ? toNumber(row.cash_variance) : null,
    total_sales: row.total_sales != null ? toNumber(row.total_sales) : null,
    total_refunds: row.total_refunds != null ? toNumber(row.total_refunds) : null,
    transaction_count: row.transaction_count,
    opened_at: row.opened_at,
    closed_at: row.closed_at,
    close_notes: row.close_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toOpenCashierShiftRow(row: CashierShiftRow): OpenCashierShiftRow {
  return {
    id: row.id,
    total_sales: row.total_sales,
    total_refunds: row.total_refunds,
    transaction_count: row.transaction_count,
    opened_at: row.opened_at.toISOString(),
    opening_cash: row.opening_cash,
  };
}

export async function summarizeShiftSales(input: {
  pharmacyId: string;
  branchId: string;
  cashierId: string;
  openedAt: Date | string;
}): Promise<ShiftSalesSummary> {
  const openedAt =
    input.openedAt instanceof Date ? input.openedAt : new Date(input.openedAt);

  const sales = await prisma.sales.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId,
      cashier_id: input.cashierId,
      status: "completed",
      created_at: { gte: openedAt },
    },
    select: {
      total_amount: true,
      payment_method: true,
      customer_amount: true,
    },
  });

  let totalSales = 0;
  let cashSales = 0;
  let transactionCount = 0;

  for (const sale of sales) {
    const amount = toNumber(sale.customer_amount ?? sale.total_amount);
    totalSales += amount;
    transactionCount += 1;
    if (sale.payment_method === "cash") {
      cashSales += amount;
    }
  }

  return { totalSales, cashSales, transactionCount };
}

export async function findOpenCashierShift(
  cashierId: string,
  branchId: string,
): Promise<CashierShiftRow | null> {
  const row = await prisma.cashier_shifts.findFirst({
    where: {
      cashier_id: cashierId,
      branch_id: branchId,
      status: "open",
    },
  });
  return row ? mapShift(row) : null;
}

export async function findOpenCashierShiftForUser(input: {
  pharmacyId: string;
  branchId: string;
  cashierId: string;
}): Promise<CashierShiftRow | null> {
  const row = await prisma.cashier_shifts.findFirst({
    where: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId,
      cashier_id: input.cashierId,
      status: "open",
    },
  });
  return row ? mapShift(row) : null;
}

export async function listOpenShiftsForBranch(input: {
  pharmacyId: string;
  branchId: string;
}): Promise<
  Array<{
    id: string;
    cashier_id: string;
    opened_at: string;
    opening_cash: number;
    status: cashier_shift_status;
  }>
> {
  const rows = await prisma.cashier_shifts.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId,
      status: "open",
    },
    select: {
      id: true,
      cashier_id: true,
      opened_at: true,
      opening_cash: true,
      status: true,
    },
    orderBy: { opened_at: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    cashier_id: row.cashier_id,
    opened_at: row.opened_at.toISOString(),
    opening_cash: toNumber(row.opening_cash),
    status: row.status,
  }));
}

export async function openCashierShift(input: {
  pharmacyId: string;
  branchId: string;
  cashierId: string;
  openingCash: number;
}): Promise<CashierShiftRow> {
  const row = await prisma.cashier_shifts.create({
    data: {
      pharmacy_id: input.pharmacyId,
      branch_id: input.branchId,
      cashier_id: input.cashierId,
      opening_cash: input.openingCash,
      status: "open",
    },
  });
  return mapShift(row);
}

export async function closeCashierShift(input: {
  shiftId: string;
  cashierId: string;
  expectedCash: number;
  actualCash: number;
  totalSales: number;
  transactionCount: number;
  closeNotes: string | null;
}): Promise<CashierShiftRow> {
  const variance = input.actualCash - input.expectedCash;
  const row = await prisma.cashier_shifts.update({
    where: { id: input.shiftId },
    data: {
      status: "closed",
      closed_at: new Date(),
      expected_cash: input.expectedCash,
      actual_cash: input.actualCash,
      cash_variance: variance,
      total_sales: input.totalSales,
      transaction_count: input.transactionCount,
      close_notes: input.closeNotes,
    },
  });
  return mapShift(row);
}

export async function getCashierShiftById(input: {
  shiftId: string;
  cashierId: string;
  status?: cashier_shift_status;
}): Promise<CashierShiftRow | null> {
  const row = await prisma.cashier_shifts.findFirst({
    where: {
      id: input.shiftId,
      cashier_id: input.cashierId,
      ...(input.status ? { status: input.status } : {}),
    },
  });
  return row ? mapShift(row) : null;
}

export async function findCashierDisplayNames(
  cashierIds: string[],
): Promise<Map<string, string>> {
  const nameById = new Map<string, string>();
  if (cashierIds.length === 0) return nameById;

  const profiles = await prisma.public_users.findMany({
    where: { id: { in: cashierIds } },
    select: { id: true, full_name: true, name: true, email: true },
  });

  for (const profile of profiles) {
    const label =
      profile.full_name ||
      profile.name ||
      (profile.email ? profile.email.split("@")[0] : null) ||
      "Staff";
    nameById.set(profile.id, label);
  }

  return nameById;
}
