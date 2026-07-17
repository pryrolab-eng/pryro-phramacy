import type { BranchUsage } from "@/lib/saas/types";
import type { SaasBranchWithUsage } from "@/lib/http/saas-branches";
import {
  statusToneBarClass,
  usageTone,
  type StatusTone,
} from "@/lib/ui/status-tone";

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
): Extract<StatusTone, "success" | "warning" | "danger"> {
  return usageTone(pct, blocked);
}

/** @deprecated Prefer usageBarTone → statusToneBarClass; kept as "default"|"warning"|"danger" */
export function usageBarClassName(
  tone: "default" | "warning" | "danger" | ReturnType<typeof usageBarTone>,
) {
  if (tone === "default") return statusToneBarClass.success;
  if (tone === "warning") return statusToneBarClass.warning;
  if (tone === "danger") return statusToneBarClass.danger;
  return statusToneBarClass[tone];
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
