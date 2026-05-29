import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "./dashboard-tokens";

type Props = {
  children: ReactNode;
  className?: string;
};

export function DashboardPageShell({ children, className }: Props) {
  return (
    <div className={cn(dashboardSurfaces.page, className)}>
      <div className={dashboardSurfaces.pageInner}>{children}</div>
    </div>
  );
}
