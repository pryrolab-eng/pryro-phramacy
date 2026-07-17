import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardSurfaces } from "@/components/dashboard/dashboard-tokens";
import {
  statusToneChipClass,
  type StatusTone,
} from "@/lib/ui/status-tone";

const ADMIN_CHIP_TONE: Record<
  "neutral" | "active" | "inactive" | "plan",
  StatusTone
> = {
  neutral: "muted",
  active: "success",
  inactive: "muted",
  plan: "muted",
};

/** Unified status/plan chips across admin dashboard lists. */
export function AdminStatusChip({
  children,
  tone = "neutral",
  statusTone,
  className,
  title,
}: {
  children: ReactNode;
  /** @deprecated Prefer `statusTone` for semantic colors */
  tone?: "neutral" | "active" | "inactive" | "plan";
  statusTone?: StatusTone;
  className?: string;
  title?: string;
}) {
  const resolved = statusTone ?? ADMIN_CHIP_TONE[tone];
  const toneClass =
    tone === "plan" && !statusTone
      ? "border-neutral-200/80 bg-white text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200"
      : statusToneChipClass[resolved];

  return (
    <span
      title={title}
      className={cn(
        "inline-flex min-h-5 shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium leading-none",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AdminRowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className={cn(dashboardSurfaces.iconBox, "h-9 w-9")}>
      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
    </div>
  );
}

/** Flat row — no card-in-card border (Untitled list style). */
export function AdminFlatRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3 first:pt-0 last:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminDividedList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-neutral-100 dark:divide-neutral-800",
        className,
      )}
    >
      {children}
    </div>
  );
}
