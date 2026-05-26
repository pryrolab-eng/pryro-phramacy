import { fetchJson } from "../client";
import type { AdminBillingPayload } from "@/lib/admin/billing-enrichment";

export const adminBillingQueryKey = ["admin", "billing"] as const;

export type {
  AdminBillingPayload,
  AdminBillingPaymentRow,
  AdminBillingPharmacyRow,
  AdminBillingReconciliationRow,
  AdminBillingSummary,
} from "@/lib/admin/billing-enrichment";

export async function getAdminBilling(): Promise<AdminBillingPayload> {
  return fetchJson<AdminBillingPayload>("/api/admin/billing");
}

export async function cancelAdminPendingBilling(body: {
  payment_transaction_id?: string;
  subscription_id?: string;
  pharmacy_id?: string;
}): Promise<{ success: boolean; type?: string; cancelled?: number }> {
  return fetchJson("/api/admin/billing/cancel-pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
