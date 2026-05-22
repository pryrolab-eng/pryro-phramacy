import type { SubscriptionLifecycleStatus } from "./types";

/** Statuses that grant product access (current plan until expires_at). */
export const ACCESS_GRANTING_STATUSES: SubscriptionLifecycleStatus[] = [
  "active",
  "scheduled_change",
];

export function statusGrantsAccess(
  status: string | null | undefined
): boolean {
  return ACCESS_GRANTING_STATUSES.includes(
    status as SubscriptionLifecycleStatus
  );
}

export function deriveIsActive(
  status: SubscriptionLifecycleStatus
): boolean {
  return statusGrantsAccess(status);
}

/** Normalize legacy DB status values into canonical lifecycle status. */
export function normalizeLifecycleStatus(
  raw: string | null | undefined,
  opts?: {
    is_active?: boolean | null;
    payment_method?: string | null;
    pending_change_status?: string | null;
  }
): SubscriptionLifecycleStatus {
  if (opts?.pending_change_status === "scheduled") {
    return "scheduled_change";
  }

  const s = (raw ?? "").toLowerCase();

  if (s === "pending_payment" || s === "pending") {
    return "pending_payment";
  }
  if (s === "scheduled_change") return "scheduled_change";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "expired") return "expired";
  if (s === "past_due") return "past_due";
  if (s === "active") return "active";

  if (opts?.payment_method === "pending") return "pending_payment";
  if (opts?.is_active === true) return "active";
  if (opts?.is_active === false && opts?.payment_method === "cancelled") {
    return "cancelled";
  }

  return "expired";
}
