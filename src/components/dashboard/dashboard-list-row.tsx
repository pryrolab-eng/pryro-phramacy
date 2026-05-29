import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "./dashboard-tokens";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "warning" | "danger";
};

const variantClass = {
  default: "",
  warning: "border-amber-200/80 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
  danger: "border-red-200/80 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20",
};

export function DashboardListRow({
  children,
  className,
  variant = "default",
}: Props) {
  return (
    <div className={cn(dashboardSurfaces.listRow, variantClass[variant], className)}>
      {children}
    </div>
  );
}
