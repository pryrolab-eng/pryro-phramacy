"use client";

import { useEffect, type ReactNode } from "react";
import { useDashboardScrollHeader } from "@/components/shell/dashboard-scroll-header-context";
import { cn } from "@/lib/utils";
import { dashboardText } from "./dashboard-tokens";
import { motion } from "motion/react";

type Props = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function DashboardPageHeader({
  title,
  description,
  actions,
  className,
}: Props) {
  const { isPinned, setHeaderConfig, registerSentinel } =
    useDashboardScrollHeader();

  useEffect(() => {
    setHeaderConfig({ title });
    return () => setHeaderConfig(null);
  }, [title, setHeaderConfig]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        initial={false}
        animate={{
          opacity: isPinned ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:items-center",
          isPinned && "pointer-events-none select-none",
        )}
        aria-hidden={isPinned}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 space-y-0.5">
            <h1 className={dashboardText.title}>{title}</h1>
            {description ? (
              <p className={dashboardText.description}>{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </motion.div>
      <div
        ref={registerSentinel}
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full"
        aria-hidden
      />
    </div>
  );
}
