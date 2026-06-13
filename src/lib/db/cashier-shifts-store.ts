import {
  closeCashierShift,
  findCashierDisplayNames,
  findOpenCashierShift,
  findOpenCashierShiftForUser,
  getCashierShiftById,
  listOpenShiftsForBranch,
  openCashierShift,
  summarizeShiftSales,
  toOpenCashierShiftRow,
  type CashierShiftRow,
  type OpenCashierShiftRow,
  type ShiftSalesSummary,
} from "@/lib/db/cashier-shifts";

export type { CashierShiftRow, OpenCashierShiftRow, ShiftSalesSummary };

export async function storeFetchOpenCashierShift(
  cashierId: string,
  branchId: string,
): Promise<OpenCashierShiftRow | null> {
  const row = await findOpenCashierShift(cashierId, branchId);
  return row ? toOpenCashierShiftRow(row) : null;
}

export async function storeSummarizeShiftSales(input: {
  pharmacyId: string;
  branchId: string;
  cashierId: string;
  openedAt: string;
}): Promise<ShiftSalesSummary> {
  return summarizeShiftSales({
    pharmacyId: input.pharmacyId,
    branchId: input.branchId,
    cashierId: input.cashierId,
    openedAt: input.openedAt,
  });
}

export async function storeGetOpenShiftForUser(input: {
  pharmacyId: string;
  branchId: string;
  cashierId: string;
}): Promise<CashierShiftRow | null> {
  return findOpenCashierShiftForUser(input);
}

export async function storeListOpenTeamShifts(input: {
  pharmacyId: string;
  branchId: string;
}) {
  return listOpenShiftsForBranch(input);
}

export async function storeFindCashierDisplayNames(
  cashierIds: string[],
): Promise<Map<string, string>> {
  return findCashierDisplayNames(cashierIds);
}

export async function storeOpenCashierShift(input: {
  pharmacyId: string;
  branchId: string;
  cashierId: string;
  openingCash: number;
}): Promise<CashierShiftRow> {
  const existing = await findOpenCashierShift(input.cashierId, input.branchId);
  if (existing) {
    throw new Error("You already have an open shift for this branch");
  }
  return openCashierShift(input);
}

export async function storeCloseCashierShift(input: {
  shiftId: string;
  cashierId: string;
  pharmacyId: string;
  branchId: string;
  actualCash: number;
  closeNotes: string | null;
}): Promise<{
  shift: CashierShiftRow;
  summary: ShiftSalesSummary & {
    expectedCash: number;
    actualCash: number;
    variance: number;
    totalRefunds: number;
  };
}> {
  const shift = await getCashierShiftById({
    shiftId: input.shiftId,
    cashierId: input.cashierId,
    status: "open",
  });
  if (!shift) {
    throw new Error("Open shift not found");
  }

  const salesSummary = await summarizeShiftSales({
    pharmacyId: input.pharmacyId,
    branchId: input.branchId,
    cashierId: input.cashierId,
    openedAt: shift.opened_at,
  });

  const expectedCash = shift.opening_cash + salesSummary.cashSales;
  const variance = input.actualCash - expectedCash;

  const closed = await closeCashierShift({
    shiftId: input.shiftId,
    cashierId: input.cashierId,
    expectedCash,
    actualCash: input.actualCash,
    totalSales: salesSummary.totalSales,
    transactionCount: salesSummary.transactionCount,
    closeNotes: input.closeNotes,
  });

  return {
    shift: closed,
    summary: {
      ...salesSummary,
      expectedCash,
      actualCash: input.actualCash,
      variance,
      totalRefunds: shift.total_refunds ?? 0,
    },
  };
}

export function serializeCashierShift(row: CashierShiftRow): Record<string, unknown> {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    branch_id: row.branch_id,
    cashier_id: row.cashier_id,
    status: row.status,
    opening_cash: row.opening_cash,
    expected_cash: row.expected_cash,
    actual_cash: row.actual_cash,
    cash_variance: row.cash_variance,
    total_sales: row.total_sales,
    total_refunds: row.total_refunds,
    transaction_count: row.transaction_count,
    opened_at: row.opened_at.toISOString(),
    closed_at: row.closed_at?.toISOString() ?? null,
    close_notes: row.close_notes,
    created_at: row.created_at?.toISOString() ?? null,
    updated_at: row.updated_at?.toISOString() ?? null,
  };
}
