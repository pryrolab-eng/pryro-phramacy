/**
 * Universal status tones — colors carry meaning across the app.
 *
 * success  green   — good / active / paid / complete
 * warning  amber   — needs attention / pending
 * caution  orange  — urgent but recoverable (past due)
 * danger   red     — failed / expired / blocked / overdue
 * info     sky     — in progress / informational
 * muted    neutral — cancelled / void / inactive / unknown
 */

export type StatusTone =
  | "success"
  | "warning"
  | "caution"
  | "danger"
  | "info"
  | "muted";

/** Soft pill classes (badges, chips). */
export const statusToneBadgeClass: Record<StatusTone, string> = {
  success:
    "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  caution:
    "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  danger:
    "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  info: "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  muted:
    "border-transparent bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

/** Bordered chip (admin lists). */
export const statusToneChipClass: Record<StatusTone, string> = {
  success:
    "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400",
  warning:
    "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400",
  caution:
    "border-orange-200/80 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-400",
  danger:
    "border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400",
  info: "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-400",
  muted:
    "border-neutral-200/80 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400",
};

/** Callout / alert surface. */
export const statusToneSurfaceClass: Record<StatusTone, string> = {
  success:
    "border-emerald-200/80 bg-emerald-50/40 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200",
  warning:
    "border-amber-200/80 bg-amber-50/40 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200",
  caution:
    "border-orange-200/80 bg-orange-50/40 text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-200",
  danger:
    "border-red-200/80 bg-red-50/40 text-red-900 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200",
  info: "border-sky-200/80 bg-sky-50/40 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200",
  muted:
    "border-neutral-200/80 bg-neutral-50/80 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300",
};

export const statusToneTextClass: Record<StatusTone, string> = {
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  caution: "text-orange-700 dark:text-orange-400",
  danger: "text-red-700 dark:text-red-400",
  info: "text-sky-700 dark:text-sky-400",
  muted: "text-neutral-500 dark:text-neutral-400",
};

export const statusToneIconClass: Record<StatusTone, string> = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  caution: "text-orange-500",
  danger: "text-red-500",
  info: "text-sky-500",
  muted: "text-neutral-400",
};

export const statusToneBarClass: Record<StatusTone, string> = {
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  caution: "bg-orange-500 dark:bg-orange-400",
  danger: "bg-red-500 dark:bg-red-400",
  info: "bg-sky-500 dark:bg-sky-400",
  muted: "bg-neutral-400 dark:bg-neutral-500",
};

function norm(status: string | null | undefined): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/** Subscription lifecycle statuses. */
export function subscriptionStatusTone(
  status: string | null | undefined,
): StatusTone {
  switch (norm(status)) {
    case "active":
      return "success";
    case "pending":
    case "pending_payment":
    case "scheduled_change":
      return "warning";
    case "past_due":
      return "caution";
    case "expired":
    case "failed":
      return "danger";
    case "cancelled":
    case "canceled":
    case "void":
      return "muted";
    default:
      return "muted";
  }
}

/** Invoice / bill statuses. */
export function invoiceStatusTone(
  status: string | null | undefined,
): StatusTone {
  switch (norm(status)) {
    case "paid":
    case "completed":
      return "success";
    case "open":
    case "draft":
    case "pending":
    case "issued":
      return "warning";
    case "overdue":
    case "failed":
      return "danger";
    case "void":
    case "cancelled":
    case "canceled":
      return "muted";
    default:
      return "muted";
  }
}

/** Payment transaction statuses. */
export function paymentStatusTone(
  status: string | null | undefined,
): StatusTone {
  switch (norm(status)) {
    case "completed":
    case "paid":
    case "success":
      return "success";
    case "pending":
    case "processing":
    case "initiated":
      return "warning";
    case "failed":
    case "declined":
    case "error":
      return "danger";
    case "cancelled":
    case "canceled":
    case "refunded":
    case "void":
      return "muted";
    default:
      return "muted";
  }
}

/** Pharmacy platform access statuses. */
export function pharmacyAccessTone(
  status: string | null | undefined,
): StatusTone {
  const s = norm(status) || "active";
  if (s === "suspended") return "danger";
  if (s === "inactive") return "muted";
  if (
    s === "pending_payment" ||
    s === "subscription_expired" ||
    s === "no_subscription" ||
    s === "past_due" ||
    s === "subscription_cancelled"
  ) {
    return s === "past_due" || s === "subscription_expired"
      ? "caution"
      : "warning";
  }
  if (s === "active") return "success";
  return "muted";
}

/** Usage bar: healthy → warning → danger. */
export function usageTone(
  pct: number,
  blocked = false,
): Extract<StatusTone, "success" | "warning" | "danger"> {
  if (blocked || pct >= 100) return "danger";
  if (pct >= 80) return "warning";
  return "success";
}
