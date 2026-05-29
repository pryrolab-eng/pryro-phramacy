import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "./dashboard-tokens";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Compact card for staff / entity grids on management pages. */
export function DashboardStaffCard({ children, className }: Props) {
  return (
    <div className={cn(dashboardSurfaces.card, "p-4", className)}>{children}</div>
  );
}
