import type { ComponentProps, ReactNode } from "react";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer } from "@/components/ui/chart";
import type { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { DashboardSectionCard } from "./dashboard-section-card";
import { DashboardPanelSkeleton } from "./dashboard-panel-skeleton";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  config: ChartConfig;
  children: ComponentProps<typeof ResponsiveContainer>["children"];
  loading?: boolean;
  className?: string;
  contentClassName?: string;
  chartClassName?: string;
  footer?: ReactNode;
  skeletonRows?: number;
  empty?: ReactNode;
};

/**
 * Chart panel: section card + ChartContainer. Use for all dashboard charts.
 */
export function DashboardChartCard({
  title,
  description,
  action,
  config,
  children,
  loading,
  className,
  contentClassName,
  chartClassName,
  footer,
  skeletonRows = 3,
  empty,
}: Props) {
  return (
    <DashboardSectionCard
      title={title}
      description={description}
      action={action}
      className={className}
      contentClassName={cn(footer ? "pb-4" : undefined, contentClassName)}
    >
      {loading ? (
        <DashboardPanelSkeleton rows={skeletonRows} />
      ) : empty ? (
        empty
      ) : (
        <ChartContainer config={config} className={chartClassName}>
          {children}
        </ChartContainer>
      )}
      {footer ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 text-sm dark:border-neutral-800">
          {footer}
        </div>
      ) : null}
    </DashboardSectionCard>
  );
}
