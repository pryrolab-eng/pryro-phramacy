import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "./dashboard-tokens";
import type { ComponentProps } from "react";

type DashboardTabsListProps = ComponentProps<typeof TabsList>;

/** Styled tab list for dashboard pages. */
export function DashboardTabsList({ className, ...props }: DashboardTabsListProps) {
  return (
    <TabsList className={cn(dashboardSurfaces.tabsList, className)} {...props} />
  );
}
