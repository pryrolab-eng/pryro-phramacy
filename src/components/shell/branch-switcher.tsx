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
  /** When true, shows "All branches" for unrestricted owners/admins (reports). */
  showAllOption?: boolean;
  /** Current scope value ("all" or branch ID) */
  scope?: string;
  /** Called when scope changes */
  onScopeChange?: (value: string) => void;
};

export function BranchSwitcher({
  className,
  showAllOption,
  scope,
  onScopeChange,
}: Props) {
  const { activeBranchId, allowedBranchIds } = useActivePharmacy();
  const {
    branches,
    isLoading,
    isError,
    canSwitchBranch,
    isAccessBlocked,
  } = useEntitledBranches();

  /** "All branches" is only for unrestricted staff (owners/admins / no allow-list). */
  const canViewAllBranches = allowedBranchIds === null;
  const showAll = Boolean(showAllOption && canViewAllBranches);

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

  // Single assigned location — locked label (no switcher, no "All")
  if (!canSwitchBranch) {
    return (
      <div
        className={cn(dashboardSurfaces.pill, className)}
        title={
          isAccessBlocked
            ? "Branch switching is disabled while pharmacy access is paused"
            : allowedBranchIds !== null
              ? "Your assigned location"
              : "Active branch"
        }
      >
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        <span className="max-w-[160px] truncate">
          {activeBranch.name}
          {isHeadquartersBranch(activeBranch) ? " · HQ" : ""}
        </span>
        {(isAccessBlocked || allowedBranchIds !== null) && (
          <Lock className="h-3 w-3 shrink-0 text-neutral-400" aria-hidden />
        )}
      </div>
    );
  }

  return (
    <BranchSwitcherSelect
      branches={branches}
      activeBranchId={activeBranchId}
      showAllOption={showAll}
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

  const currentValue = showAllOption
    ? (scope === "all" ? "all" : (scope ?? activeBranchId ?? branches[0]?.id ?? ""))
    : (activeBranchId ?? branches[0]?.id ?? "");

  const handleValueChange = (value: string) => {
    if (showAllOption && onScopeChange) {
      onScopeChange(value);
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
        <SelectValue placeholder="Working location" />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-neutral-500" />
              All branches (reports)
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
