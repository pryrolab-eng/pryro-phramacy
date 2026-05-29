"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/** Clickable sidebar edge — chevron on hover hints collapse/expand without labels. */
export function DashboardSidebarRail() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <button
      type="button"
      data-sidebar="rail"
      aria-label="Toggle sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        "group/rail absolute inset-y-0 z-20 hidden w-5 -translate-x-1/2 transition-all ease-linear sm:flex",
        "group-data-[side=left]:-right-3 group-data-[side=right]:left-0",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
      )}
    >
      <span
        className={cn(
          "absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          "rounded-full border border-transparent bg-white opacity-0 shadow-sm transition-all duration-200",
          "group-hover/rail:opacity-100 dark:bg-neutral-900",
          "group-hover/rail:border-neutral-200/80 dark:group-hover/rail:border-neutral-700",
        )}
      >
        {collapsed ? (
          <ChevronRight
            className="size-4 text-neutral-500 dark:text-neutral-400"
            strokeWidth={2}
            aria-hidden
          />
        ) : (
          <ChevronLeft
            className="size-4 text-neutral-500 dark:text-neutral-400"
            strokeWidth={2}
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}
