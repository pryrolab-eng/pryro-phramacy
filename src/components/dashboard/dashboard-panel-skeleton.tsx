import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "./dashboard-tokens";

type DashboardPanelSkeletonProps = {
  rows?: number;
};

export function DashboardPanelSkeleton({ rows = 4 }: DashboardPanelSkeletonProps) {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(dashboardSurfaces.listRow)}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
