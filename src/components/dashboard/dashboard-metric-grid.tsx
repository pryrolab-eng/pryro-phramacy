import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  columns?: 4 | 5;
  className?: string;
};

/** Responsive grid for `DashboardStatCard` rows. */
export function DashboardMetricGrid({
  children,
  columns = 4,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 5
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
