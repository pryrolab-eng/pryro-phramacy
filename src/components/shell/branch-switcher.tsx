"use client";

import { GitBranch, Lock, Layers } from "lucide-react";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useEntitledBranches } from "@/hooks/useEntitledBranches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isHeadquartersBranch } from "@/lib/pharmacy/branch-hq";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "@/components/dashboard/dashboard-tokens";

export type BranchScopeValue = "all" | string;

type Props = {
  className?: string;
  /** When true, shows "All branches" option for report scoping */
  showAllOption?: boolean;
  /** Current scope value ("all" or branch ID) */
  scope?: string;
  /** Called when scope changes */
  onScopeChange?: (value: string) => void;
};

export function BranchSwitcher({ className, showAllOption, scope, onScopeChange }: Props) {
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

  // Show "All branches" mode for report scoping
  if (showAllOption && !canSwitchBranch) {
    return (
      <BranchSwitcherSelect
        branches={branches}
        activeBranchId={activeBranchId}
        showAllOption
        scope={scope}
        onScopeChange={onScopeChange}
        className={className}
      />
    );
  }

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
    <BranchSwitcherSelect
      branches={branches}
      activeBranchId={activeBranchId}
      showAllOption={showAllOption}
      scope={scope}
      onScopeChange={onScopeChange}
      className={className}
    />
  );
}

function BranchSwitcherSelect({
  branches,
  activeBranchId,
  showAllOption,
  scope,
  onScopeChange,
  className,
}: {
  branches: { id: string; name: string; is_headquarters?: boolean }[];
  activeBranchId: string | null;
  showAllOption?: boolean;
  scope?: string;
  onScopeChange?: (value: string) => void;
  className?: string;
}) {
  const { switchBranch } = useActivePharmacy();

  // Determine current value: "all" for all branches, or branch ID
  const currentValue = showAllOption
    ? (scope ?? "all")
    : (activeBranchId ?? branches[0]?.id ?? "");

  const handleValueChange = (value: string) => {
    if (showAllOption && onScopeChange) {
      onScopeChange(value);
      // Also switch the server-side active branch when selecting a specific branch
      if (value !== "all") {
        void switchBranch(value);
      }
    } else {
      void switchBranch(value);
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger
        className={cn(
          dashboardSurfaces.pill,
          "h-8 w-full max-w-[min(100%,14rem)]",
          className,
        )}
      >
        <SelectValue placeholder="Select branch" />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-neutral-500" />
              All branches
            </div>
          </SelectItem>
        )}
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
            {isHeadquartersBranch(b) ? " · HQ" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
