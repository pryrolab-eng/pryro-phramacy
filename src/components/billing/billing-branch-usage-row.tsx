"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardListRow, DashboardProgressTrack } from "@/components/dashboard";
import {
  usageBarClassName,
  usageBarTone,
  usagePct,
} from "@/lib/branches/branch-usage";

type BranchUsage = {
  tx_count: number;
  tx_limit: number;
  is_blocked: boolean;
  billing_cycle_end: string;
};

type Props = {
  branch: { id: string; name: string; usage: BranchUsage | null };
};

export function BillingBranchUsageRow({ branch }: Props) {
  const usage = branch.usage;

  if (!usage) {
    return (
      <DashboardListRow className="items-center py-3">
        <span className="text-sm font-medium">{branch.name}</span>
        <Badge variant="secondary" className="text-[10px]">
          No usage record
        </Badge>
      </DashboardListRow>
    );
  }

  const pct = usagePct(usage);
  const tone = usageBarTone(pct, usage.is_blocked);

  return (
    <DashboardListRow
      className={
        usage.is_blocked
          ? "border-red-200/80 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20"
          : undefined
      }
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{branch.name}</span>
          {usage.is_blocked ? (
            <Badge variant="destructive" className="h-5 gap-0.5 text-[10px]">
              <AlertTriangle className="size-3" />
              Blocked
            </Badge>
          ) : null}
        </div>
        <DashboardProgressTrack
          value={pct}
          barClassName={usageBarClassName(tone)}
        />
        <p className="text-xs text-neutral-500">
          Resets {new Date(usage.billing_cycle_end).toLocaleDateString()}
        </p>
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums">
        {usage.tx_count.toLocaleString()} / {usage.tx_limit.toLocaleString()}
      </span>
    </DashboardListRow>
  );
}
