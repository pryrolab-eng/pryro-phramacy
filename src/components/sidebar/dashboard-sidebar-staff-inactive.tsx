"use client";

import Link from "next/link";
import { AlertTriangle, CreditCard, LifeBuoy } from "lucide-react";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";
import { useAccessBlockMessaging } from "@/hooks/useAccessBlockMessaging";
import { usePlatformSupport } from "@/hooks/usePlatformSupport";
import { BILLING_ROUTE } from "@/lib/subscription/subscription-grace-routes";
import { cn } from "@/lib/utils";

/** Expanded footer for staff when dashboard access is blocked. */
export function DashboardSidebarStaffInactive() {
  const { messaging, canAccessBilling } = useAccessBlockMessaging();
  const { supportMailto } = usePlatformSupport();
  const isDestructive =
    messaging.badgeVariant === "destructive";

  return (
    <div
      className={cn(
        dashboardSidebarTokens.upgradeCard,
        "space-y-2 p-2",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2 py-1",
          isDestructive
            ? "border-red-200/80 bg-red-50/90 dark:border-red-900/40 dark:bg-red-950/40"
            : "border-amber-200/80 bg-amber-50/90 dark:border-amber-900/40 dark:bg-amber-950/40",
        )}
      >
        <AlertTriangle
          className={cn(
            "size-3 shrink-0",
            isDestructive
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400",
          )}
        />
        <p
          className={cn(
            "text-[10px] font-medium leading-tight",
            isDestructive
              ? "text-red-900 dark:text-red-100"
              : "text-amber-900 dark:text-amber-100",
          )}
        >
          {messaging.shortLabel}
        </p>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        {messaging.description}
      </p>
      {canAccessBilling ? (
        <Link
          href={BILLING_ROUTE}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary py-1 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <CreditCard className="size-3" />
          {messaging.billingCta}
        </Link>
      ) : (
        <a
          href={supportMailto("Pharmacy dashboard support")}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-neutral-200 bg-background py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-muted dark:border-neutral-700"
        >
          <LifeBuoy className="size-3" />
          Contact support
        </a>
      )}
    </div>
  );
}
