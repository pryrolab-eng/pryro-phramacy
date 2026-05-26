import { fetchJson } from "./client";

export const kpayKeys = {
  all: ["kpay"] as const,
  status: (transactionId: string) =>
    [...kpayKeys.all, "status", transactionId] as const,
};

export type KpayStatusResponse = {
  transaction: {
    status: string;
    error_message?: string;
  };
};

export async function getKpayTransactionStatus(
  transactionId: string,
): Promise<KpayStatusResponse> {
  return fetchJson<KpayStatusResponse>(
    `/api/kpay/status?transactionId=${encodeURIComponent(transactionId)}`,
    { credentials: "include" },
  );
}

export async function getKpayPaymentStatus(params: {
  tid?: string | null;
  refid?: string | null;
}): Promise<KpayStatusResponse> {
  const query = params.tid
    ? `tid=${encodeURIComponent(params.tid)}`
    : `refid=${encodeURIComponent(params.refid ?? "")}`;
  return fetchJson<KpayStatusResponse>(`/api/kpay/status?${query}`, {
    credentials: "include",
  });
}

export type InitiateKpayPaymentInput = {
  amount: number;
  saleId?: string;
  subscriptionId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: string;
  bankId: string;
  details?: string;
};

export type InitiateKpayPaymentResponse = {
  success: boolean;
  transaction?: {
    checkoutUrl?: string;
    [key: string]: unknown;
  };
  error?: string;
  kpayResponse?: { statusdesc?: string };
};

export async function initiateKpayPayment(
  body: InitiateKpayPaymentInput,
): Promise<InitiateKpayPaymentResponse> {
  return fetchJson<InitiateKpayPaymentResponse>("/api/kpay/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
