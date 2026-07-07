"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeaderConfig({ title });
    return () => setHeaderConfig(null);
  }, [title, setHeaderConfig]);

  useEffect(() => {
    registerSentinel(sentinelRef.current);
    return () => registerSentinel(null);
  }, [registerSentinel]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        initial={false}
        animate={{
          opacity: isPinned ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:items-center"
        aria-hidden={isPinned}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            isPinned && "pointer-events-none select-none",
          )}
        >
          <div className="min-w-0 space-y-0.5">
            <h1 className={dashboardText.title}>{title}</h1>
            {description ? (
              <p className={dashboardText.description}>{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div
            className={cn(
              "flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end",
              isPinned && "pointer-events-none invisible",
            )}
          >
            {actions}
          </div>
        ) : null}
      </motion.div>
      <div
        ref={sentinelRef}
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full"
        aria-hidden
      />
    </div>
  );
}
