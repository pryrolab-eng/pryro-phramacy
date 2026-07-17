import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardSurfaces, dashboardText } from "./dashboard-tokens";

type Props = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
  iconClassName?: string;
};

export function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  className,
  valueClassName,
  iconClassName,
}: Props) {
  return (
    <div className={cn(dashboardSurfaces.card, "p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className={dashboardText.statLabel}>{label}</p>
        <div className={dashboardSurfaces.iconBox}>
          <Icon
            className={cn(
              "h-4 w-4 text-neutral-600 dark:text-neutral-300",
              iconClassName,
            )}
            strokeWidth={1.75}
          />
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className={cn(dashboardText.statValue, valueClassName)}>{value}</p>
        )}
        {hint ? (
          <p className={cn("mt-1", dashboardText.statHint)}>
            {loading ? "…" : hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
