import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardSurfaces, dashboardText } from "./dashboard-tokens";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: Props) {
  return (
    <div className={cn(dashboardSurfaces.card, className)}>
      <div className={dashboardSurfaces.sectionHeader}>
        <div className="min-w-0 space-y-0.5">
          <h2 className={dashboardText.sectionTitle}>{title}</h2>
          {description ? (
            <p className={dashboardText.sectionDescription}>{description}</p>
          ) : null}
        </div>
        {action ? (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {action}
          </div>
        ) : null}
      </div>
      <div className={cn(dashboardSurfaces.sectionBody, contentClassName)}>
        {children}
      </div>
    </div>
  );
}
