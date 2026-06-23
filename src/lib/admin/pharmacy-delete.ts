import { normalizeLifecycleStatus } from "@/lib/subscription/lifecycle/status";
import type { SubscriptionLifecycleStatus } from "@/lib/subscription/lifecycle/types";
import {
  storeCancelSubscriptionsByIds,
  storeListSubscriptionsForPharmacyDelete,
} from "@/lib/db/admin-store";

type SubRow = {
  id: string;
  status?: string | null;
  is_active?: boolean | null;
  payment_method?: string | null;
  pending_change_status?: string | null;
};

const BLOCKING_LIFECYCLES: SubscriptionLifecycleStatus[] = [
  "active",
  "scheduled_change",
];

const CANCELLABLE_BEFORE_DELETE: SubscriptionLifecycleStatus[] = [
  "pending_payment",
];

function lifecycleOf(row: SubRow): SubscriptionLifecycleStatus {
  return normalizeLifecycleStatus(row.status ?? "", {
    is_active: row.is_active,
    payment_method: row.payment_method,
    pending_change_status: row.pending_change_status,
  });
}

export type PreparePharmacyDeleteResult =
  | { ok: true; cancelledSubscriptionIds: string[] }
  | { ok: false; reason: "active_subscriptions" }
  | { ok: false; reason: "subscription_check_failed"; message: string };

/**
 * Cancels unpaid/pending checkouts, then allows delete only when no access-granting main sub remains.
 */
export async function preparePharmacyForAdminDelete(
  pharmacyId: string,
): Promise<PreparePharmacyDeleteResult> {
  try {
    const rows = (await storeListSubscriptionsForPharmacyDelete(
      pharmacyId,
    )) as SubRow[];

    const blockingIds: string[] = [];
    const cancelIds: string[] = [];

    for (const row of rows) {
      const lifecycle = lifecycleOf(row);
      const rawStatus = String(row.status ?? "").toLowerCase();
      if (BLOCKING_LIFECYCLES.includes(lifecycle)) {
        blockingIds.push(row.id);
      } else if (
        CANCELLABLE_BEFORE_DELETE.includes(lifecycle) ||
        rawStatus === "pending"
      ) {
        cancelIds.push(row.id);
      }
    }

    if (cancelIds.length > 0) {
      await storeCancelSubscriptionsByIds(cancelIds);
    }

    if (blockingIds.length > 0) {
      return { ok: false, reason: "active_subscriptions" };
    }

    return { ok: true, cancelledSubscriptionIds: cancelIds };
  } catch (error) {
    return {
      ok: false,
      reason: "subscription_check_failed",
      message: error instanceof Error ? error.message : "Subscription check failed",
    };
  }
}
