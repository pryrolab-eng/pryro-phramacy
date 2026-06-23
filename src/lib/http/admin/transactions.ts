import { fetchJson } from "../client";

export const adminTransactionsQueryKey = ["admin", "transactions"] as const;

export type AdminPaymentTransactionRow = {
  id: string;
  pharmacy_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  payment_method: string | null;
  payment_provider: string | null;
  payment_details: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  polar_checkout_id: string | null;
  completed_at: string | null;
  created_at: string;
  pharmacies:
    | { id: string; name: string; email: string | null }
    | { id: string; name: string; email: string | null }[]
    | null;
};

export type AdminSubscriptionRow = {
  id: string;
  pharmacy_id: string;
  plan: string | null;
  is_active: boolean;
  expires_at: string | null;
  payment_method: string | null;
};

export type AdminTransactionsResponse = {
  transactions: AdminPaymentTransactionRow[];
  subscriptions: AdminSubscriptionRow[];
};

export async function getAdminTransactions(): Promise<AdminTransactionsResponse> {
  return fetchJson<AdminTransactionsResponse>("/api/admin/transactions");
}
