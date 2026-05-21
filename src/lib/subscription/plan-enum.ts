export type SubscriptionPlanEnum = "trial" | "standard" | "premium";

export function planNameToEnum(name: string): SubscriptionPlanEnum {
  const n = (name || "").toLowerCase();
  if (n.includes("premium")) return "premium";
  if (n.includes("standard")) return "standard";
  if (n.includes("basic") || n.includes("free")) return "trial";
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
