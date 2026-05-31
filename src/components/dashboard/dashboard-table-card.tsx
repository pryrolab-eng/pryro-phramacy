import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashboardSectionCard } from "./dashboard-section-card";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Section card optimized for data tables (toolbar + scrollable table). */
export function DashboardTableCard({
  title,
  description,
  action,
  toolbar,
  children,
  className,
}: Props) {
  return (
    <DashboardSectionCard
      title={title}
      description={description}
      action={action}
      className={className}
      contentClassName="p-0"
    >
      {toolbar ? (
        <div className="flex min-w-0 flex-col gap-2 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:px-5 dark:border-neutral-800">
          {toolbar}
        </div>
      ) : null}
      <div className="min-w-0 overflow-x-auto">{children}</div>
    </DashboardSectionCard>
  );
}
