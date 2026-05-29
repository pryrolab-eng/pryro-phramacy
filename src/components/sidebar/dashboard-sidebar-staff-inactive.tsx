"use client";

import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";
import { BILLING_ROUTE } from "@/lib/subscription/subscription-grace-routes";
import { cn } from "@/lib/utils";

/** Expanded footer for staff when subscription is inactive. */
export function DashboardSidebarStaffInactive() {
  return (
    <div
      className={cn(
        dashboardSidebarTokens.upgradeCard,
        "space-y-2 p-2",
      )}
    >
      <div className="flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1 dark:border-amber-900/40 dark:bg-amber-950/40">
        <AlertTriangle className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-[10px] font-medium leading-tight text-amber-900 dark:text-amber-100">
          Subscription inactive
        </p>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Tell the owner, or open billing if they asked you to renew.
      </p>
      <Link
        href={BILLING_ROUTE}
        className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary py-1 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <CreditCard className="size-3" />
        Open billing
      </Link>
    </div>
  );
}
