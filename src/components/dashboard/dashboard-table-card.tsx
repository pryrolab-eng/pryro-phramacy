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
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
    </DashboardSectionCard>
  );
}
