import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "./dashboard-tokens";
import { DashboardButton } from "./dashboard-button";

type DashboardPanelEmptyProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function DashboardPanelEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: DashboardPanelEmptyProps) {
  return (
    <div className={cn(dashboardSurfaces.empty, className)}>
      <div className={cn(dashboardSurfaces.iconBox, "mb-4 h-12 w-12")}>
        <Icon className="h-5 w-5 text-neutral-500" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
        {title}
      </p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-neutral-500">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <DashboardButton tone="primary" asChild className="mt-5">
          <Link href={actionHref}>{actionLabel}</Link>
        </DashboardButton>
      ) : null}
    </div>
  );
}
