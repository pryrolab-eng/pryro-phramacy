"use client";

import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  Check,
  Crown,
  GitBranch,
  Users,
} from "lucide-react";
import { DashboardButton } from "@/components/dashboard";
import { PlanFeatureList } from "@/components/subscription/plan-feature-list";
import { cn } from "@/lib/utils";

export type PlanCardAction = "current" | "upgrade" | "downgrade" | "subscribe";

export type CatalogPlan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  current: boolean;
  plan_type: "main" | "branch_addon";
  monthly_tx_limit: number;
  max_users: number;
  max_branches: number;
};

interface PlanCardProps {
  plan: CatalogPlan;
  action: PlanCardAction;
  onSelect: () => void;
  compact?: boolean;
}

export function PlanCard({
  plan,
  action,
  onSelect,
  compact,
}: PlanCardProps) {
  const isCurrent = action === "current";
  const isUpgrade = action === "upgrade";
  const isDowngrade = action === "downgrade";
  const isSubscribe = action === "subscribe";
  const isRecommended =
    (isUpgrade || isSubscribe) && plan.name.toLowerCase() === "standard";

  return (
    <article
      className={cn(
        "relative flex h-full w-full flex-col rounded-xl border bg-card text-left shadow-sm transition-shadow hover:shadow-md",
        isCurrent && "border-primary/40 ring-1 ring-primary/20",
        isRecommended && "border-primary/30 shadow-md",
        !isCurrent && !isRecommended && "border-border/80",
      )}
    >
      <div className="flex min-h-[1.75rem] items-center justify-center px-3 pt-4">
        {isCurrent ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Current plan
          </span>
        ) : isRecommended ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            <Crown className="size-3" />
            Recommended
          </span>
        ) : isDowngrade ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Lower tier
          </span>
        ) : isUpgrade || isSubscribe ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            Higher tier
          </span>
        ) : (
          <span className="h-5" aria-hidden />
        )}
      </div>

      <header className={cn("px-4 pb-3 text-center", compact ? "pt-1" : "pt-2")}>
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {plan.name}
        </h3>
        <div className="mt-2 flex flex-col items-center gap-0.5">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {plan.price.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              RWF
            </span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            per month
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <dl
          className={cn(
            "grid gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs",
            compact && "gap-1.5 p-2.5",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <GitBranch className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              Branches
            </dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {plan.max_branches}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Users
            </dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {plan.max_users}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
              Transactions
            </dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {plan.monthly_tx_limit.toLocaleString()}/mo
            </dd>
          </div>
        </dl>

        <div className="min-h-0 flex-1">
          <PlanFeatureList
            features={plan.features}
            maxVisible={compact ? 4 : 5}
            dense={compact}
            className="text-left"
          />
        </div>

        <div className="mt-auto pt-1">
          {isCurrent ? (
            <DashboardButton
              type="button"
              tone="outline"
              className="w-full cursor-not-allowed opacity-80"
              disabled
            >
              <Check className="mr-1.5 size-4" />
              Current plan
            </DashboardButton>
          ) : isDowngrade ? (
            <DashboardButton
              type="button"
              tone="outline"
              className="w-full"
              onClick={onSelect}
            >
              <ArrowDown className="mr-1.5 size-4" />
              Schedule downgrade
            </DashboardButton>
          ) : isSubscribe ? (
            <DashboardButton
              type="button"
              tone="primary"
              className="w-full"
              onClick={onSelect}
            >
              <ArrowUpRight className="mr-1.5 size-4" />
              Subscribe
            </DashboardButton>
          ) : (
            <DashboardButton
              type="button"
              tone="primary"
              className="w-full"
              onClick={onSelect}
            >
              <ArrowUpRight className="mr-1.5 size-4" />
              Upgrade
            </DashboardButton>
          )}
        </div>
      </div>
    </article>
  );
}
