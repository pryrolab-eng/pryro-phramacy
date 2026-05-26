export type SubscriptionPlanEnum = "trial" | "standard" | "premium";

export function planNameToEnum(name: string): SubscriptionPlanEnum {
  const n = (name || "").toLowerCase();
  if (n.includes("branch add") || n.includes("branch_addon") || n.includes("extra branch")) {
    return "trial";
  }
  if (n.includes("premium")) return "premium";
  if (n.includes("standard")) return "standard";
  /** $0 catalog tiers (Free, Free Trial, Starter at price 0). */
  if (
    n.includes("starter") ||
    n.includes("stater") ||
    n.includes("free") ||
    n.includes("trial") ||
    n.includes("basic")
  ) {
    return "trial";
  }
  return "trial";
}

export function computeSubscriptionExpiresAt(
  period?: string | null,
  from: Date = new Date()
): Date {
  const expiresAt = new Date(from);
  const p = (period ?? "per month").toLowerCase();
  if (p.includes("year")) {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else if (p === "forever" || p.includes("forever")) {
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}
