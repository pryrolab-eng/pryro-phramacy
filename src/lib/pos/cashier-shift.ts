import {
  storeFetchOpenCashierShift,
  type OpenCashierShiftRow,
} from "@/lib/db/cashier-shifts-store";

export const SHIFT_REQUIRED_CODE = "SHIFT_REQUIRED";

export type { OpenCashierShiftRow };

export const SHIFT_REQUIRED_MESSAGE =
  "Open a cashier shift before completing a sale or return.";

export async function fetchOpenCashierShift(
  cashierId: string,
  branchId: string,
): Promise<OpenCashierShiftRow | null> {
  return storeFetchOpenCashierShift(cashierId, branchId);
}
