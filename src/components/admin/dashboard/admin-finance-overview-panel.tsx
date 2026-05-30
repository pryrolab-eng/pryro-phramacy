"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import {
  DashboardButton,
  DashboardSectionCard,
} from "@/components/dashboard";
import { AdminDividedList, AdminFlatRow } from "@/components/admin/dashboard/admin-dashboard-ui";
import type { PlanDistributionRow } from "@/components/admin/dashboard/admin-plan-distribution-panel";

type Props = {
  plans: PlanDistributionRow[];
  subscriptionRevenue: number;
  paymentRevenue: number;
};

export function AdminFinanceOverviewPanel({
  plans,
  subscriptionRevenue,
  paymentRevenue,
}: Props) {
  return (
    <DashboardSectionCard
      title="Finance overview"
      description="Estimated recurring revenue by plan (same source as Reports)"
      contentClassName="pt-4"
    >
      <AdminDividedList>
        {plans.map((plan) => (
          <AdminFlatRow key={plan.name}>
            <span className="min-w-0 flex-1 truncate text-sm text-neutral-600 dark:text-neutral-400">
              {plan.name}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
              RWF {plan.revenue.toLocaleString()}
            </span>
          </AdminFlatRow>
        ))}
      </AdminDividedList>

      <div className="mt-4 space-y-3 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            Est. recurring total
          </span>
          <span className="text-lg font-semibold tabular-nums tracking-tight text-neutral-900 dark:text-neutral-50">
            RWF {subscriptionRevenue.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-neutral-500">
          <span>Completed payments (all time)</span>
          <span className="tabular-nums">RWF {paymentRevenue.toLocaleString()}</span>
        </div>
        <DashboardButton tone="outline" className="mt-1 w-full" asChild>
          <Link href="/admin/billing">
            <Receipt className="mr-2 h-4 w-4" />
            View transactions
          </Link>
        </DashboardButton>
      </div>
    </DashboardSectionCard>
  );
}
