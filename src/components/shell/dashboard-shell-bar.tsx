"use client";

import { BranchSwitcher } from "@/components/shell/branch-switcher";
import { useDashboardScrollHeader } from "@/components/shell/dashboard-scroll-header-context";
import { dashboardText, dashboardChrome } from "@/components/dashboard/dashboard-tokens";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type DashboardShellBarProps = {
  /** Pharmacy routes show branch switcher; platform admin does not. */
  showBranchSwitcher?: boolean;
};

/** Sticky top bar: page title pins on scroll; sidebar toggles via rail or Ctrl+B. */
export function DashboardShellBar({
  showBranchSwitcher = true,
}: DashboardShellBarProps) {
  const { isPinned, config } = useDashboardScrollHeader();

  return (
    <div
      className={cn(
        dashboardChrome.shellBar,
        dashboardChrome.height,
        isPinned || showBranchSwitcher ? "justify-between" : "justify-end",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <AnimatePresence mode="popLayout">
          {isPinned && config ? (
            <motion.span
              key="pinned-header"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(dashboardText.title, "truncate text-base")}
            >
              {config.title}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      {showBranchSwitcher ? <BranchSwitcher className="shrink-0" /> : null}
    </div>
  );
}
