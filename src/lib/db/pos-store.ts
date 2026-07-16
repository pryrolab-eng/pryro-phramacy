import type {
  payment_method,
  return_type,
} from "@prisma/client";
import {
  filterSellableBatches,
  sortBatchesFefo,
  type PosBatchLine,
} from "@/lib/pos/pharmacy-rules";
import { formatInventoryRowForPos } from "@/lib/pos/format-pos-product";
import {
  createHeldSaleFromDb,
  createPosSale,
  getInventoryRowsForSale,
  getSaleForReturn,
  listHeldSalesFromDb,
  listPosSellableProducts,
  lookupCompletedSale,
  processPosReturn,
  quickAddPosDrug,
  searchPosInventoryForPriceCheck,
  sumReturnedQuantitiesBySaleItem,
  sumReturnedQuantitiesBySaleItemIds,
  voidCompletedPosSale,
  type ProcessPosReturnInput,
  type SaleForReturn,
  type SaleInventoryRow,
} from "@/lib/db/pos";

export type { SaleInventoryRow };

function formatExpiryForPos(date: Date | string | null): string | null {
  if (!date) return null;
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  return String(date).slice(0, 10);
}

export async function storeListPosProducts(
  pharmacyId: string,
  branchId: string,
): Promise<PosBatchLine[]> {
  const rows = await listPosSellableProducts(pharmacyId, branchId);
  const formatted = rows.map((item) => {
    const med = item.medications
      ? {
          ...item.medications,
          id: item.medications.id ?? item.medication_id ?? item.id,
          category: item.medications.category ?? undefined,
        }
      : null;
    return formatInventoryRowForPos(
      {
        id: item.id,
        medication_id: item.medication_id,
        batch_number: item.batch_number,
        quantity_in_stock: item.quantity_in_stock ?? 0,
        selling_price: item.selling_price,
        expiry_date: formatExpiryForPos(item.expiry_date),
        medications: med,
      },
      med,
    );
  });
  return sortBatchesFefo(filterSellableBatches(formatted));
}

export async function storeGetInventoryForSale(
  ids: string[],
): Promise<SaleInventoryRow[]> {
  return getInventoryRowsForSale(ids);
}

export async function storeCreatePosSale(
  input: Parameters<typeof createPosSale>[0],
): Promise<{
  sale: Record<string, unknown>;
  saleItemIdByInventoryId: Map<string, string>;
}> {
  return createPosSale(input);
}

export async function storeQuickAddPosDrug(input: {
  pharmacyId: string;
  branchId: string;
  name: string;
  category: string;
  manufacturer: string | null;
  barcode: string | null;
  batchNumber: string;
  quantityInStock: number;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  expiryDate: string | null;
  stockLocation?: string | null;
}): Promise<{ medication: Record<string, unknown>; inventory: Record<string, unknown> }> {
  return quickAddPosDrug(input);
}

export async function storeLookupPosSale(input: {
  pharmacyId: string;
  saleId?: string;
  receipt?: string;
  branchId?: string;
}): Promise<{
  sale: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
} | null> {
  return lookupCompletedSale(input);
}

export async function storeSumReturnedBySaleItem(
  saleId: string,
): Promise<Record<string, number>> {
  return sumReturnedQuantitiesBySaleItem(saleId);
}

export type { SaleForReturn, ProcessPosReturnInput };

export async function storeGetSaleForReturn(
  saleId: string,
): Promise<SaleForReturn | null> {
  return getSaleForReturn(saleId);
}

export async function storeSumReturnedBySaleItemIds(
  saleItemIds: string[],
): Promise<Record<string, number>> {
  return sumReturnedQuantitiesBySaleItemIds(saleItemIds);
}

export async function storeProcessPosReturn(
  input: ProcessPosReturnInput,
): Promise<Record<string, unknown>> {
  return processPosReturn(input);
}

export function mapReturnTypeToDb(type: string): return_type {
  if (type === "refund") return "refund";
  if (type === "exchange") return "exchange";
  return "return";
}

export function mapPaymentMethodToDb(method: string): payment_method {
  switch (method) {
    case "mobile":
      return "mobile_money";
    case "split":
      return "mixed";
    case "card":
      return "card";
    case "insurance":
      return "insurance";
    default:
      return "cash";
  }
}

export async function storeVoidPosSale(
  input: Parameters<typeof voidCompletedPosSale>[0],
): Promise<Record<string, unknown> | null> {
  return voidCompletedPosSale(input);
}

export async function storeSearchPosPriceCheck(
  input: Parameters<typeof searchPosInventoryForPriceCheck>[0],
) {
  return searchPosInventoryForPriceCheck(input);
}

export async function storeCreateHeldSale(
  input: Parameters<typeof createHeldSaleFromDb>[0],
): Promise<Record<string, unknown>> {
  return createHeldSaleFromDb(input);
}

export async function storeListHeldSales(
  input: Parameters<typeof listHeldSalesFromDb>[0],
): Promise<Array<Record<string, unknown>>> {
  return listHeldSalesFromDb(input);
}
