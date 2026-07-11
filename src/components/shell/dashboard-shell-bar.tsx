"use client";

import { BranchSwitcher } from "@/components/shell/branch-switcher";
import { NotificationBell } from "@/components/shell/notification-bell";
import { useDashboardScrollHeader } from "@/components/shell/dashboard-scroll-header-context";
import { dashboardText, dashboardChrome } from "@/components/dashboard/dashboard-tokens";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useBranchScope } from "@/hooks/useBranchScope";

type DashboardShellBarProps = {
  /** Pharmacy routes show branch switcher; platform admin does not. */
  showBranchSwitcher?: boolean;
};

/** Sticky top bar: page title pins on scroll; sidebar toggles via menu or Ctrl+B. */
export function DashboardShellBar({
  showBranchSwitcher = true,
}: DashboardShellBarProps) {
  const { isPinned, config } = useDashboardScrollHeader();
  const { branchScope, setBranchScope } = useBranchScope();

  return (
    <div
      className={cn(
        dashboardChrome.shellBar,
        dashboardChrome.height,
        "justify-between",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="shrink-0 md:hidden" />
        <AnimatePresence mode="popLayout">
          {isPinned && config ? (
            <motion.span
              key="pinned-header"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(dashboardText.title, "truncate text-sm sm:text-base")}
            >
              {config.title}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      {showBranchSwitcher ? (
        <div className="flex w-full min-w-0 items-center justify-end gap-1 md:w-auto">
          <NotificationBell />
          <BranchSwitcher showAllOption scope={branchScope} onScopeChange={setBranchScope} className="max-w-full" />
        </div>
      ) : null}
    </div>
  );
}
