"use client";

import { GitBranch, Lock } from "lucide-react";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useEntitledBranches } from "@/hooks/useEntitledBranches";
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
  const { activeBranchId } = useActivePharmacy();
  const {
    branches,
    isLoading,
    isError,
    canSwitchBranch,
    isAccessBlocked,
  } = useEntitledBranches();

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

  if (isError) {
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

  const activeBranch =
    branches.find((b) => b.id === activeBranchId) ?? branches[0];

  if (!canSwitchBranch) {
    return (
      <div
        className={cn(dashboardSurfaces.pill, className)}
        title={
          isAccessBlocked
            ? "Branch switching is disabled while pharmacy access is paused"
            : "Active branch"
        }
      >
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        <span className="max-w-[160px] truncate">{activeBranch.name}</span>
        {isAccessBlocked ? (
          <Lock className="h-3 w-3 shrink-0 text-neutral-400" aria-hidden />
        ) : null}
      </div>
    );
  }

  return (
    <BranchSwitcherSelect branches={branches} activeBranchId={activeBranchId} className={className} />
  );
}

function BranchSwitcherSelect({
  branches,
  activeBranchId,
  className,
}: {
  branches: { id: string; name: string }[];
  activeBranchId: string | null;
  className?: string;
}) {
  const { switchBranch } = useActivePharmacy();

  return (
    <Select
      value={activeBranchId ?? branches[0]?.id ?? ""}
      onValueChange={(id) => void switchBranch(id)}
    >
      <SelectTrigger
        className={cn(
          dashboardSurfaces.pill,
          "h-8 w-full max-w-[min(100%,14rem)]",
          className,
        )}
      >
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
