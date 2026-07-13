import { ensureApiSuccess, fetchJson } from "./client";

export type PosProduct = {
  id: string;
  medicationId: string;
  name: string;
  price: number;
  stock: number;
  batch: string;
  expiryDate: string | null;
  daysToExpiry: number;
  requiresPrescription: boolean;
  strength?: string | null;
  dosageForm?: string | null;
  genericName?: string | null;
  barcode?: string | null;
  category?: string | null;
};

export type PosCustomer = {
  id?: string | null;
  name: string;
  phone: string;
  insuranceNumber: string;
  insuranceType: string;
  coveragePercent: number;
};

export type PosCartItem = PosProduct & { quantity: number };

export type PrescriptionConfirmation = {
  confirmed: boolean;
  patientName?: string;
  prescriberName?: string;
  notes?: string;
};

export type PosSalePayload = {
  customer: PosCustomer;
  items: PosCartItem[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  paymentMethod: string;
  cashAmount: number;
  insuranceAmount: number;
  branchId?: string | null;
  prescriptionConfirmation?: PrescriptionConfirmation;
  nearExpiryAcknowledged?: boolean;
};

export type PosSaleResult = {
  success: boolean;
  receiptNumber?: string;
  error?: string;
  message?: string;
};

export type ApiSuccessResult = {
  success: boolean;
  error?: string;
};

export type QuickAddPatientResult = {
  success: boolean;
  error?: string;
  customer?: {
    id?: string;
    name: string;
    phone: string;
    insurance_number?: string | null;
  };
};

export type AiSafetyResult = {
  interactions: string[];
  warnings: string[];
  severity: string;
  recommendations: string[];
  source?: {
    id: string;
    name: string;
    clinicalDataset: boolean;
  };
  ruleMatches?: Array<{
    type: string;
    severity: string;
    source: string;
    message: string;
  }>;
  aiPowered?: boolean;
  reasoning?: string;
};

export type AiSafetyResponse = {
  success: boolean;
  result?: AiSafetyResult;
};

export const posKeys = {
  all: ["pos"] as const,
  products: (branchId?: string | null) =>
    [...posKeys.all, "products", branchId ?? "none"] as const,
  fastMoving: (branchId?: string | null) =>
    [...posKeys.all, "fast-moving", branchId ?? "none"] as const,
  customerLookup: (phone: string) =>
    [...posKeys.all, "customer-lookup", phone] as const,
  priceCheck: (q: string) => [...posKeys.all, "price-check", q] as const,
  shift: (branchId?: string | null) =>
    [...posKeys.all, "shift", branchId ?? "none"] as const,
  teamOpenShifts: (branchId?: string | null) =>
    [...posKeys.all, "team-open-shifts", branchId ?? "none"] as const,
};

export type TeamOpenCashierShift = {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  openingCash: number;
  isCurrentUser: boolean;
  liveTotalSales: number;
  liveTransactionCount: number;
};

export async function getPosProducts(
  branchId?: string | null,
): Promise<PosProduct[]> {
  try {
    const params = new URLSearchParams();
    if (branchId && branchId !== "all") {
      params.set("branchId", branchId);
    }
    const url = params.toString() ? `/api/pos/products?${params}` : "/api/pos/products";
    const data = await fetchJson<PosProduct[]>(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPosFastMovingProducts(
  branchId?: string | null,
): Promise<PosProduct[]> {
  try {
    const params = new URLSearchParams();
    if (branchId && branchId !== "all") {
      params.set("branchId", branchId);
    }
    const url = params.toString() ? `/api/pos/products?${params}` : "/api/pos/products";
    const data = await fetchJson<PosProduct[]>(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function processPosSale(
  payload: PosSalePayload,
): Promise<PosSaleResult> {
  const data = await fetchJson<PosSaleResult>("/api/pos/sale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  ensureApiSuccess(data, "Failed to save sale");
  return data;
}

export async function holdPosSale(payload: {
  cart: PosCartItem[];
  customer: PosCustomer;
}): Promise<ApiSuccessResult> {
  return fetchJson<ApiSuccessResult>("/api/pos/hold-sale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function lookupPosCustomerByPhone(
  phone: string,
): Promise<Array<{ id?: string | null; name: string; phone?: string }>> {
  const data = await fetchJson<unknown>(
    `/api/pos/customer-lookup?phone=${encodeURIComponent(phone)}`,
  );
  return Array.isArray(data)
    ? (data as Array<{ id?: string | null; name: string; phone?: string }>)
    : [];
}

export async function checkPosPrice(
  query: string,
): Promise<Array<{ name: string; price: number }>> {
  const data = await fetchJson<unknown>(
    `/api/pos/price-check?q=${encodeURIComponent(query)}`,
  );
  return Array.isArray(data)
    ? (data as Array<{ name: string; price: number }>)
    : [];
}

export async function voidPosSale(payload: {
  saleId: string;
  reason: string;
}): Promise<ApiSuccessResult> {
  return fetchJson<ApiSuccessResult>("/api/pos/void-sale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function quickAddPosPatient(payload: {
  patientName: string;
  phoneNumber: string;
  insuranceNumber?: string;
}): Promise<QuickAddPatientResult> {
  return fetchJson<QuickAddPatientResult>("/api/pos/quick-add-patient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export type PosQuickAddEndpoint =
  | "/api/pos/quick-add-drug"
  | "/api/pos/quick-add-insurance"
  | "/api/pos/quick-add-category";

export async function quickAddPosEntity(
  endpoint: PosQuickAddEndpoint,
  body: Record<string, FormDataEntryValue>,
): Promise<ApiSuccessResult & { error?: string }> {
  return fetchJson<ApiSuccessResult & { error?: string }>(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type ReturnDisposition = "restock" | "damaged" | "destroy";

export type PosSaleLookupItem = {
  saleItemId: string;
  inventoryId: string | null;
  name: string;
  quantitySold: number;
  quantityReturned: number;
  quantityAvailable: number;
  unitPrice: number;
  batch: string | null;
  expiryDate: string | null;
};

export type PosSaleLookup = {
  id: string;
  receiptNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: number;
  paymentMethod: string;
  branchId: string;
  createdAt: string;
  items: PosSaleLookupItem[];
};

export type PosReturnLine = {
  saleItemId: string;
  inventoryId: string;
  quantity: number;
  disposition: ReturnDisposition;
};

export type PosReturnPayload = {
  saleId: string;
  branchId: string;
  returnType: "return" | "refund" | "exchange";
  reason: string;
  notes?: string;
  refundAmount?: number;
  refundMethod?: string;
  items: PosReturnLine[];
};

export type CashierShift = {
  id: string;
  status: "open" | "closed";
  opening_cash: number;
  expected_cash?: number | null;
  actual_cash?: number | null;
  cash_variance?: number | null;
  total_sales?: number;
  total_refunds?: number;
  transaction_count?: number;
  opened_at: string;
  closed_at?: string | null;
  liveTotalSales?: number;
  liveCashSales?: number;
  liveTransactionCount?: number;
};

export async function lookupPosSale(params: {
  receipt?: string;
  saleId?: string;
  branchId: string;
}): Promise<PosSaleLookup> {
  const q = new URLSearchParams({ branchId: params.branchId });
  if (params.receipt) q.set("receipt", params.receipt);
  if (params.saleId) q.set("saleId", params.saleId);
  const data = await fetchJson<{ sale: PosSaleLookup; error?: string }>(
    `/api/pos/sales/lookup?${q.toString()}`,
  );
  if (!data.sale) {
    throw new Error(data.error ?? "Sale not found");
  }
  return data.sale;
}

export async function processPosReturn(
  payload: PosReturnPayload,
): Promise<ApiSuccessResult & { error?: string; refundAmount?: number }> {
  const data = await fetchJson<
    ApiSuccessResult & { error?: string; refundAmount?: number }
  >("/api/pos/returns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  ensureApiSuccess(data, "Failed to process return");
  return data;
}

export async function getCurrentCashierShift(
  branchId: string,
): Promise<CashierShift | null> {
  const data = await fetchJson<{ shift: CashierShift | null }>(
    `/api/pos/shifts?branchId=${encodeURIComponent(branchId)}`,
  );
  return data.shift ?? null;
}

export async function getTeamOpenCashierShifts(
  branchId: string,
): Promise<TeamOpenCashierShift[]> {
  const data = await fetchJson<{ team: TeamOpenCashierShift[] }>(
    `/api/pos/shifts?branchId=${encodeURIComponent(branchId)}&team=open`,
  );
  return data.team ?? [];
}

export async function openCashierShift(payload: {
  branchId: string;
  openingCash: number;
}): Promise<CashierShift> {
  const data = await fetchJson<{ success: boolean; shift: CashierShift }>(
    "/api/pos/shifts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "open",
        branchId: payload.branchId,
        openingCash: payload.openingCash,
      }),
    },
  );
  if (!data.shift) {
    throw new Error("Shift was not created");
  }
  return data.shift;
}

export async function closeCashierShift(payload: {
  branchId: string;
  shiftId: string;
  actualCash: number;
  closeNotes?: string;
}): Promise<{
  shift: CashierShift;
  summary: {
    expectedCash: number;
    actualCash: number;
    variance: number;
    totalSales: number;
    cashSales: number;
    transactionCount: number;
    totalRefunds: number;
  };
}> {
  return fetchJson("/api/pos/shifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "close",
      branchId: payload.branchId,
      shiftId: payload.shiftId,
      actualCash: payload.actualCash,
      closeNotes: payload.closeNotes,
    }),
  });
}

export async function analyzeCartSafety(
  items: PosCartItem[],
): Promise<AiSafetyResponse> {
  return fetchJson<AiSafetyResponse>("/api/ai-safety", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}
