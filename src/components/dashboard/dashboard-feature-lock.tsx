"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardSurfaces, dashboardText } from "./dashboard-tokens";
import { DashboardButton } from "./dashboard-button";

export type DashboardFeatureLockProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
  className?: string;
  /** Minimum height for chart/tab panels (matches `DashboardPanelEmpty`). */
  minHeight?: boolean;
};

/** Locked-feature / upgrade prompt — use inside `FeatureGate` fallbacks. */
export function DashboardFeatureLock({
  title,
  description = "This capability is not included in your current plan.",
  actionLabel = "View plans",
  onAction,
  className,
  minHeight = true,
}: DashboardFeatureLockProps) {
  return (
    <div
      className={cn(
        dashboardSurfaces.empty,
        "w-full",
        minHeight && "min-h-[280px]",
        className,
      )}
    >
      <div className={cn(dashboardSurfaces.iconBox, "mb-4 h-12 w-12")}>
        <Lock className="h-5 w-5 text-neutral-500" strokeWidth={1.75} />
      </div>
      <p className={cn(dashboardText.sectionTitle, "text-center")}>{title}</p>
      <p
        className={cn(
          dashboardText.sectionDescription,
          "mt-1 max-w-sm text-center leading-relaxed",
        )}
      >
        {description}
      </p>
      <DashboardButton tone="primary" className="mt-5" onClick={onAction}>
        {actionLabel}
      </DashboardButton>
    </div>
  );
}
