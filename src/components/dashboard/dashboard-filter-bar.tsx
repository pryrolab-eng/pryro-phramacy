import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashboardSectionCard } from "./dashboard-section-card";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

/** Filter row panel (branch, dates, report type, etc.). */
export function DashboardFilterBar({
  title = "Filters",
  description,
  children,
  className,
  action,
}: Props) {
  return (
    <DashboardSectionCard
      title={title}
      description={description}
      action={action}
      className={cn("no-print", className)}
      contentClassName="pt-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {children}
      </div>
    </DashboardSectionCard>
  );
}
