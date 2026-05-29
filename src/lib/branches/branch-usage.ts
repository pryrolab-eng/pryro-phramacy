import type { BranchUsage } from "@/lib/saas/types";
import type { SaasBranchWithUsage } from "@/lib/http/saas-branches";

export function usagePct(
  usage:
    | Pick<BranchUsage, "tx_count" | "tx_limit">
    | null
    | undefined,
): number {
  if (!usage || usage.tx_limit === 0) return 0;
  return Math.min(100, Math.round((usage.tx_count / usage.tx_limit) * 100));
}

export function usageBarTone(
  pct: number,
  blocked: boolean,
): "default" | "warning" | "danger" {
  if (blocked || pct >= 100) return "danger";
  if (pct >= 80) return "warning";
  return "default";
}

export function usageBarClassName(tone: ReturnType<typeof usageBarTone>) {
  if (tone === "danger") return "bg-red-500 dark:bg-red-400";
  if (tone === "warning") return "bg-amber-500 dark:bg-amber-400";
  return "bg-emerald-500 dark:bg-emerald-400";
}

export function branchStats(branches: SaasBranchWithUsage[]) {
  const active = branches.filter((b) => b.is_active).length;
  const blocked = branches.filter((b) => b.usage?.is_blocked).length;
  const nearLimit = branches.filter((b) => {
    const u = b.usage;
    if (!u || u.is_blocked) return false;
    const pct = usagePct(u);
    return pct >= 80;
  }).length;

  return {
    total: branches.length,
    active,
    blocked,
    nearLimit,
  };
}
