"use client";

import Link from "next/link";
import { Building2, Lock } from "lucide-react";
import {
  DashboardButton,
  DashboardProgressTrack,
  DashboardSectionCard,
} from "@/components/dashboard";
import {
  isAtLimit,
  limitUsageBarClass,
  limitUsageBorderClass,
  limitUsagePct,
} from "@/lib/billing/limit-display";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import type { PharmacySubscriptionSummary } from "@/lib/saas/types";

type Props = {
  summary: PharmacySubscriptionSummary | undefined;
  branchCount: number;
  branchLimit: number;
  mainSlots: number;
  addonCount: number;
  canAddBranch: boolean;
  needsAddonForNewBranch: boolean;
  hasAddonPlans: boolean;
  onBuyAddon: () => void;
};

export function BranchSlotsBanner({
  summary,
  branchCount,
  branchLimit,
  mainSlots,
  addonCount,
  canAddBranch,
  needsAddonForNewBranch,
  hasAddonPlans,
  onBuyAddon,
}: Props) {
  const pct = limitUsagePct(branchCount, branchLimit);
  const atLimit = isAtLimit(branchCount, branchLimit);

  return (
    <DashboardSectionCard
      title="Branch slots"
      description={
        summary?.main_subscription?.plan?.name
          ? `${summary.main_subscription.plan.name} · ${mainSlots} included${addonCount > 0 ? ` + ${addonCount} add-on${addonCount !== 1 ? "s" : ""}` : ""}`
          : `${mainSlots} included on main plan`
      }
      className={limitUsageBorderClass(atLimit)}
      action={
        <div className="flex flex-wrap gap-2">
          {needsAddonForNewBranch && hasAddonPlans ? (
            <DashboardButton size="sm" onClick={onBuyAddon}>
              Buy add-on
            </DashboardButton>
          ) : null}
          {!canAddBranch && !needsAddonForNewBranch && branchLimit > 0 ? (
            <DashboardButton size="sm" asChild>
              <Link href={PHARMACY_ROUTES.billing}>Upgrade plan</Link>
            </DashboardButton>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Building2 className="mt-0.5 size-5 shrink-0 text-neutral-500" />
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {branchCount} of {branchLimit} slot{branchLimit !== 1 ? "s" : ""}{" "}
              used
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {canAddBranch
                ? `${branchLimit - branchCount} slot${branchLimit - branchCount !== 1 ? "s" : ""} available`
                : needsAddonForNewBranch
                  ? "Purchase a branch add-on for another location"
                  : "Limit reached — upgrade or add an add-on"}
            </p>
          </div>
        </div>
        <div className="flex min-w-[180px] items-center gap-3">
          <DashboardProgressTrack
            value={pct}
            className="flex-1"
            barClassName={limitUsageBarClass(atLimit)}
          />
          <span className="text-xs font-medium tabular-nums text-neutral-600">
            {branchCount}/{branchLimit}
          </span>
        </div>
      </div>

      {!summary?.main_subscription ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200/80 bg-red-50/50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            No active subscription.{" "}
            <Link
              href={PHARMACY_ROUTES.billing}
              className="font-medium underline"
            >
              Subscribe
            </Link>{" "}
            to create branches and process transactions.
          </p>
        </div>
      ) : null}
    </DashboardSectionCard>
  );
}
