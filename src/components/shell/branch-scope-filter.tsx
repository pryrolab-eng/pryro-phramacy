"use client";

import { useMemo } from "react";
import { GitBranch } from "lucide-react";
import { useSaasBranches } from "@/hooks/useSaasSubscription";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dashboardButtonClass } from "@/components/dashboard/dashboard-tokens";
import { cn } from "@/lib/utils";

export type BranchScopeValue = "all" | string;

type Props = {
  value: BranchScopeValue;
  onChange: (value: BranchScopeValue) => void;
  className?: string;
};

/** Report scope: all branches vs one. Hidden when only one branch (shell bar shows active branch). */
export function BranchScopeFilter({ value, onChange, className }: Props) {
  const branchesQuery = useSaasBranches();
  const branches = branchesQuery.data ?? [];

  const label = useMemo(() => {
    if (value === "all") return "All branches";
    return branches.find((b) => b.id === value)?.name ?? "Branch";
  }, [value, branches]);

  if (branches.length <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="hidden text-xs text-neutral-500 sm:inline">Reports</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn(dashboardButtonClass.outline, "w-[min(100%,11rem)] gap-1.5 text-xs font-medium")}>
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <SelectValue placeholder="Branch scope">{label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All branches</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
