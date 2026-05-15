/** Normalize DB enum / free-text plan values for grouping and display. */
export function normalizePlanKey(plan: string | null | undefined): string {
  const raw = String(plan ?? "trial").trim().toLowerCase();
  if (raw === "premium") return "premium";
  if (raw === "standard") return "standard";
  if (raw === "trial" || raw === "free") return "trial";
  return raw || "trial";
}

export function planDisplayName(key: string | null | undefined): string {
  switch (normalizePlanKey(key)) {
    case "premium":
      return "Premium";
    case "standard":
      return "Standard";
    case "trial":
      return "Trial";
    default:
      return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

export const PLAN_ORDER = ["premium", "standard", "trial"] as const;
