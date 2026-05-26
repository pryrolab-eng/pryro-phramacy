import { fetchJson } from "./client";

export const billingKeys = {
  all: ["billing"] as const,
  invoices: () => [...billingKeys.all, "invoices"] as const,
};

export type BillingInvoiceRow = {
  id: string;
  date: string;
  amount: number;
  status: string;
  planName?: string;
  provider?: string;
  invoiceNumber?: string;
};

export type BillingInfoResponse = {
  nextBilling?: string;
  amount?: number;
  paymentMethod?: string;
  emailReceiptsEnabled?: boolean;
  history?: BillingInvoiceRow[];
  invoices?: BillingInvoiceRow[];
};

export async function getBillingInfo(): Promise<BillingInfoResponse> {
  return fetchJson<BillingInfoResponse>("/api/invoices");
}
