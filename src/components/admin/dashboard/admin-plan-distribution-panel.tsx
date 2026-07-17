"use client";

import { DashboardProgressTrack, DashboardSectionCard } from "@/components/dashboard";
import {
  AdminDividedList,
  AdminFlatRow,
} from "@/components/admin/dashboard/admin-dashboard-ui";

export type PlanDistributionRow = {
  name: string;
  count: number;
  percentage: number;
  revenue: number;
};

const PLAN_DOT_CLASS = [
  "bg-primary",
  "bg-primary/70",
  "bg-primary/40",
  "bg-primary/20",
] as const;

function planDotClass(index: number): string {
  return PLAN_DOT_CLASS[index] ?? PLAN_DOT_CLASS[PLAN_DOT_CLASS.length - 1];
}

type Props = {
  plans: PlanDistributionRow[];
  hasSubscriptionBreakdown: boolean;
};

export function AdminPlanDistributionPanel({
  plans,
  hasSubscriptionBreakdown,
}: Props) {
  return (
    <DashboardSectionCard
      title="Subscription plans"
      description={
        hasSubscriptionBreakdown
          ? "Active subscriptions from the subscriptions table"
          : "Pharmacies grouped by plan on each store"
      }
      contentClassName="pt-4"
    >
      <AdminDividedList>
        {plans.map((plan, index) => (
          <AdminFlatRow key={plan.name} className="flex-col items-stretch gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${planDotClass(index)}`}
                  aria-hidden
                />
                <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {plan.name}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                  {plan.count}
                  <span className="ml-1 font-normal text-neutral-500">
                    {hasSubscriptionBreakdown ? "subs" : "shops"}
                  </span>
                </p>
                <p className="text-xs tabular-nums text-neutral-500">
                  {plan.percentage}%
                </p>
              </div>
            </div>
            <DashboardProgressTrack
              value={plan.percentage}
              barClassName={
                index === 0
                  ? "bg-primary"
                  : index === 1
                    ? "bg-primary/70"
                    : "bg-primary/35"
              }
            />
          </AdminFlatRow>
        ))}
      </AdminDividedList>
    </DashboardSectionCard>
  );
}
