"use client";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarNavSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SidebarMenu className="gap-1.5 px-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SidebarMenuItem key={i}>
          <div
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-2.5",
              "animate-pulse bg-neutral-100 dark:bg-neutral-800/60",
            )}
          >
            <div className="size-4 shrink-0 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div
              className="h-3 flex-1 rounded bg-neutral-200 dark:bg-neutral-700"
              style={{ maxWidth: `${56 + (i % 3) * 12}%` }}
            />
          </div>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
