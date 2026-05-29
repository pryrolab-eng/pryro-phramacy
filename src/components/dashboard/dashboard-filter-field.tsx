import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardText } from "./dashboard-tokens";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function DashboardFilterField({ label, children, className }: Props) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className={cn(dashboardText.sectionDescription, "font-medium text-neutral-600")}>
        {label}
      </span>
      {children}
    </div>
  );
}
