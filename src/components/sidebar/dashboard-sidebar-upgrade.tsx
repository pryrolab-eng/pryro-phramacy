"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { TooltipContent } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";
import { PRYROX_BRAND_BLUE } from "@/lib/brand/colors";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { useAccessBlockMessaging } from "@/hooks/useAccessBlockMessaging";
import { usePlatformSupport } from "@/hooks/usePlatformSupport";
import { cn } from "@/lib/utils";

export type SidebarPlanSummaryProps = {
  planLabel: string;
  daysLeft: number | null;
  isExpired: boolean;
  billingHref?: string;
  staffUsed?: number;
  staffLimit?: number;
  branchesUsed?: number;
  branchesLimit?: number;
};

function formatPlanName(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Trial";
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function SidebarPopoverShell({ children }: { children: ReactNode }) {
  return <div className="py-0.5">{children}</div>;
}

function SidebarPopoverRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2.5 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function UsageLine({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const atLimit = max > 0 && current >= max;

  return (
    <span
      className={cn(
        "tabular-nums",
        atLimit
          ? "font-semibold text-red-600 dark:text-red-400"
          : "text-muted-foreground",
      )}
    >
      {label} {current}/{max}
    </span>
  );
}

function PlanPopoverBody({
  planLabel,
  daysLeft,
  isExpired,
  staffUsed,
  staffLimit,
  branchesUsed,
  branchesLimit,
}: SidebarPlanSummaryProps) {
  const { messaging, canAccessBilling } = useAccessBlockMessaging();
  const displayName = formatPlanName(planLabel);
  const showDays = daysLeft !== null && daysLeft >= 0 && !isExpired;
  const showUsage =
    staffUsed !== undefined &&
    staffLimit !== undefined &&
    branchesUsed !== undefined &&
    branchesLimit !== undefined;
  const blockIsDestructive = messaging.badgeVariant === "destructive";

  return (
    <SidebarPopoverShell>
      <p className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Current plan
      </p>
      <div className="mx-0.5 rounded-lg bg-muted/50 px-2.5 py-2">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: PRYROX_BRAND_BLUE }}
          >
            <Sparkles className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            {isExpired ? (
              <p
                className={cn(
                  "mt-0.5 flex items-center gap-1 text-xs",
                  blockIsDestructive
                    ? "text-red-700 dark:text-red-400"
                    : "text-amber-700 dark:text-amber-400",
                )}
              >
                <AlertTriangle className="size-3 shrink-0" />
                {messaging.shortLabel}
              </p>
            ) : showDays && daysLeft !== null ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Renews in{" "}
                <span className="font-medium text-foreground">
                  {daysLeft} day{daysLeft === 1 ? "" : "s"}
                </span>
              </p>
            ) : null}
            {showUsage ? (
              <p className="mt-1 flex flex-wrap gap-x-2 text-xs leading-snug">
                <UsageLine label="Staff" current={staffUsed} max={staffLimit} />
                <UsageLine
                  label="Branches"
                  current={branchesUsed}
                  max={branchesLimit}
                />
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <Separator className="my-1.5" />
      <div className="flex items-center gap-3 rounded-md px-2.5 py-2">
        <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium text-foreground">
          {isExpired
            ? canAccessBilling
              ? messaging.billingCta
              : "Contact support"
            : "Billing & plans"}
        </span>
        <ArrowUpRight className="size-3 shrink-0 opacity-60" />
      </div>
    </SidebarPopoverShell>
  );
}

function sidebarPopoverTooltip(
  children: ReactNode,
): ComponentProps<typeof TooltipContent> {
  return {
    side: "right",
    align: "end",
    sideOffset: 8,
    className: dashboardSidebarTokens.sidebarPopover,
    children,
  };
}

/** Popover-style tooltip for locked nav items — matches account menu panel. */
export function lockedNavTooltip(
  message: string,
): ComponentProps<typeof TooltipContent> {
  const [title, ...rest] = message.split(" — ");
  const subtitle = rest.join(" — ") || "Upgrade to unlock";

  return sidebarPopoverTooltip(
    <SidebarPopoverShell>
      <SidebarPopoverRow icon={Lock} title={title} subtitle={subtitle} />
    </SidebarPopoverShell>,
  );
}

function UsagePill({
  label,
  current,
  max,
  onAccent = false,
}: {
  label: string;
  current: number;
  max: number;
  onAccent?: boolean;
}) {
  const atLimit = max > 0 && current >= max;

  return (
    <span
      className={cn(
        "tabular-nums",
        atLimit
          ? "font-semibold text-red-200"
          : onAccent
            ? "text-white/85"
            : "text-muted-foreground",
      )}
    >
      {label} {current}/{max}
    </span>
  );
}

/** Icon-only plan control when sidebar is collapsed — popover matches account menu. */
export function DashboardSidebarPlanCollapsed(props: SidebarPlanSummaryProps) {
  const {
    billingHref = PHARMACY_ROUTES.billing,
    planLabel,
    isExpired,
  } = props;
  const { canAccessBilling } = useAccessBlockMessaging();
  const { supportMailto } = usePlatformSupport();
  const displayName = formatPlanName(planLabel);
  const footerHref =
    isExpired && !canAccessBilling
      ? supportMailto("Pharmacy dashboard support")
      : billingHref;

  return (
    <SidebarMenu className={dashboardSidebarTokens.collapsedOnly}>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={sidebarPopoverTooltip(<PlanPopoverBody {...props} />)}
          className={cn(
            dashboardSidebarTokens.navItem,
            isExpired && "text-amber-700 dark:text-amber-400",
          )}
        >
          <Link href={footerHref}>
            <Sparkles
              className="size-4 shrink-0"
              style={{ color: PRYROX_BRAND_BLUE }}
              strokeWidth={1.75}
            />
            <span className="sr-only">Current plan: {displayName}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** Compact plan summary for the sidebar footer — keeps locked nav visible above the fold. */
export function DashboardSidebarUpgrade({
  planLabel,
  daysLeft,
  isExpired,
  billingHref = PHARMACY_ROUTES.billing,
  staffUsed,
  staffLimit,
  branchesUsed,
  branchesLimit,
}: SidebarPlanSummaryProps) {
  const { messaging, canAccessBilling } = useAccessBlockMessaging();
  const { supportMailto } = usePlatformSupport();
  const displayName = formatPlanName(planLabel);
  const showDays = daysLeft !== null && daysLeft >= 0 && !isExpired;
  const showUsage =
    staffUsed !== undefined &&
    staffLimit !== undefined &&
    branchesUsed !== undefined &&
    branchesLimit !== undefined;
  const blockIsDestructive = messaging.badgeVariant === "destructive";

  return (
    <div
      className={cn(dashboardSidebarTokens.upgradeCard, "space-y-1.5 p-2")}
      style={{
        backgroundColor: PRYROX_BRAND_BLUE,
        borderColor: PRYROX_BRAND_BLUE,
        borderWidth: 1,
        borderStyle: "solid",
      }}
    >
      {isExpired ? (
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1",
            blockIsDestructive
              ? "border-red-200/80 bg-red-50/90 dark:border-red-900/40 dark:bg-red-950/40"
              : "border-amber-200/80 bg-amber-50/90 dark:border-amber-900/40 dark:bg-amber-950/40",
          )}
        >
          <AlertTriangle
            className={cn(
              "size-3 shrink-0",
              blockIsDestructive
                ? "text-red-600 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400",
            )}
          />
          <p
            className={cn(
              "text-[10px] font-medium leading-tight",
              blockIsDestructive
                ? "text-red-900 dark:text-red-100"
                : "text-amber-900 dark:text-amber-100",
            )}
          >
            {messaging.shortLabel}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-white/75">
            Current plan
          </p>
          <div className="mt-0.5 flex min-w-0 items-baseline gap-1.5">
            <p className="truncate text-xs font-semibold text-white">
              {displayName}
            </p>
            {showDays && daysLeft !== null ? (
              <span className="shrink-0 text-[10px] tabular-nums text-white/75">
                · {daysLeft}d left
              </span>
            ) : null}
          </div>
        </div>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-white">
          <Sparkles className="size-3" />
        </span>
      </div>

      {showUsage ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] leading-none">
          <UsagePill
            label="Staff"
            current={staffUsed}
            max={staffLimit}
            onAccent
          />
          <span className="text-white/40">·</span>
          <UsagePill
            label="Branches"
            current={branchesUsed}
            max={branchesLimit}
            onAccent
          />
        </p>
      ) : null}

      {isExpired && !canAccessBilling ? (
        <a
          href={supportMailto("Pharmacy dashboard support")}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-neutral-200 py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-muted/80 dark:border-neutral-700"
        >
          Contact support
          <ArrowUpRight className="size-3 opacity-60" />
        </a>
      ) : (
        <Link
          href={billingHref}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-white py-1.5 text-[10px] font-semibold transition-colors hover:bg-white/90"
          style={{ color: PRYROX_BRAND_BLUE }}
        >
          {isExpired ? messaging.billingCta : "Manage plan"}
          <ArrowUpRight className="size-3 opacity-60" />
        </Link>
      )}
    </div>
  );
}
