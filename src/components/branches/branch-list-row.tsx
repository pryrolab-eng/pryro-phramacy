"use client";

import { Building2, MapPin, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardListRow, DashboardProgressTrack } from "@/components/dashboard";
import { cn } from "@/lib/utils";
import type { SaasBranchWithUsage } from "@/lib/http/saas-branches";
import {
  usageBarClassName,
  usageBarTone,
  usagePct,
} from "@/lib/branches/branch-usage";

type Props = {
  branch: SaasBranchWithUsage;
  className?: string;
  onSelect?: (branch: SaasBranchWithUsage) => void;
};

export function BranchListRow({ branch, className, onSelect }: Props) {
  const usage = branch.usage;
  const pct = usagePct(usage);
  const tone = usageBarTone(pct, usage?.is_blocked ?? false);
  const blocked = usage?.is_blocked ?? false;

  const row = (
    <DashboardListRow
      className={cn(
        "items-start gap-4",
        blocked && "border-red-200/80 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20",
        onSelect &&
          "cursor-pointer transition-colors hover:border-neutral-300 hover:bg-neutral-50/80 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/40",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
          <Building2
            className="size-5 text-neutral-600 dark:text-neutral-300"
            strokeWidth={1.75}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-neutral-900 dark:text-neutral-50">
              {branch.name}
            </p>
            {branch.over_plan_limit ? (
              <Badge variant="outline" className="h-5 text-[10px] text-amber-800 border-amber-300">
                Extra — not on plan
              </Badge>
            ) : null}
            {blocked ? (
              <Badge variant="destructive" className="h-5 gap-0.5 text-[10px]">
                <AlertTriangle className="size-3" />
                Blocked
              </Badge>
            ) : null}
            <Badge
              variant={branch.is_active ? "default" : "secondary"}
              className="h-5 text-[10px] font-medium capitalize"
            >
              {branch.is_active ? "active" : "inactive"}
            </Badge>
          </div>
          {branch.address ? (
            <p className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{branch.address}</span>
            </p>
          ) : null}
          {usage ? (
            <div className="space-y-1.5 pr-2">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Transactions this month</span>
                <span className="font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
                  {usage.tx_count.toLocaleString()} /{" "}
                  {usage.tx_limit.toLocaleString()}
                </span>
              </div>
              <DashboardProgressTrack
                value={pct}
                barClassName={usageBarClassName(tone)}
              />
            </div>
          ) : (
            <p className="text-xs text-neutral-500">No usage for this cycle</p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {usage ? (
          <>
            <p className="text-sm font-semibold tabular-nums">{pct}%</p>
            <p className="mt-0.5 text-xs text-neutral-500">used</p>
          </>
        ) : (
          <p className="text-xs text-neutral-500">—</p>
        )}
      </div>
    </DashboardListRow>
  );

  if (!onSelect) return row;

  return (
    <button
      type="button"
      className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      onClick={() => onSelect(branch)}
    >
      {row}
    </button>
  );
}
