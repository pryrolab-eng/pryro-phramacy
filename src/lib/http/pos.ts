import { ensureApiSuccess, fetchJson } from "./client";

export type PosProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  batch: string;
  expiryDate: string;
  daysToExpiry: number;
  barcode?: string;
  category?: string;
};

export type PosCustomer = {
  name: string;
  phone: string;
  insuranceNumber: string;
  insuranceType: string;
  coveragePercent: number;
};

export type PosCartItem = PosProduct & { quantity: number };

export type PosSalePayload = {
  customer: PosCustomer;
  items: PosCartItem[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  paymentMethod: string;
  cashAmount: number;
  insuranceAmount: number;
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
};

export type AiSafetyResponse = {
  success: boolean;
  result?: AiSafetyResult;
};

export const posKeys = {
  all: ["pos"] as const,
  products: () => [...posKeys.all, "products"] as const,
  fastMoving: () => [...posKeys.all, "fast-moving"] as const,
  customerLookup: (phone: string) =>
    [...posKeys.all, "customer-lookup", phone] as const,
  priceCheck: (q: string) => [...posKeys.all, "price-check", q] as const,
};

export async function getPosProducts(): Promise<PosProduct[]> {
  try {
    const data = await fetchJson<PosProduct[]>("/api/pos/products");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getPosFastMovingProducts(): Promise<PosProduct[]> {
  try {
    const data = await fetchJson<PosProduct[]>(
      "/api/pos/products?fastMoving=true",
    );
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
): Promise<Array<{ name: string; phone?: string }>> {
  const data = await fetchJson<unknown>(
    `/api/pos/customer-lookup?phone=${encodeURIComponent(phone)}`,
  );
  return Array.isArray(data) ? (data as Array<{ name: string; phone?: string }>) : [];
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

export async function processPosReturn(payload: {
  sale_id: string;
  reason: string;
  refund_amount: number;
}): Promise<ApiSuccessResult & { error?: string }> {
  return fetchJson<ApiSuccessResult & { error?: string }>("/api/pos/returns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
