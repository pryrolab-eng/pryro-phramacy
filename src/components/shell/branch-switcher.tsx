"use client";

import { GitBranch } from "lucide-react";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useSaasBranches } from "@/hooks/useSaasSubscription";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "@/components/dashboard/dashboard-tokens";

type Props = {
  className?: string;
};

export function BranchSwitcher({ className }: Props) {
  const { activeBranchId, allowedBranchIds, switchBranch, isHydrating: ctxHydrating } =
    useActivePharmacy();
  const branchesQuery = useSaasBranches();
  const allBranches = branchesQuery.data ?? [];
  const branches =
    allowedBranchIds === null
      ? allBranches
      : allBranches.filter((b) => allowedBranchIds.includes(b.id));

  const isLoading =
    ctxHydrating ||
    branchesQuery.isPending ||
    (branchesQuery.isFetching && branchesQuery.data === undefined);

  if (isLoading) {
    return (
      <div
        className={cn(
          dashboardSurfaces.pill,
          "animate-pulse text-neutral-400",
          className,
        )}
        aria-busy
        aria-label="Loading branches"
      >
        <GitBranch className="h-3.5 w-3.5 shrink-0 opacity-40" />
        <span className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    );
  }

  if (branchesQuery.isError) {
    return (
      <div
        className={cn(dashboardSurfaces.pill, "text-muted-foreground", className)}
        title="Could not load branches"
      >
        <GitBranch className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">Branch unavailable</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return null;
  }

  if (branches.length === 1) {
    return (
      <div className={cn(dashboardSurfaces.pill, className)} title="Active branch">
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        <span className="max-w-[160px] truncate">{branches[0].name}</span>
      </div>
    );
  }

  return (
    <Select
      value={activeBranchId ?? branches[0]?.id ?? ""}
      onValueChange={(id) => void switchBranch(id)}
    >
      <SelectTrigger className={cn(dashboardSurfaces.pill, "w-[min(100%,14rem)]", className)}>
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
