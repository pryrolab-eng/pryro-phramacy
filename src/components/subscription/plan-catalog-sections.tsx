"use client";

import { ArrowDown, CheckCircle2 } from "lucide-react";
import {
  PlanCard,
  type CatalogPlan,
  type PlanCardAction,
} from "@/components/subscription/plan-card";

export type { PlanCardAction, CatalogPlan };

type Props = {
  currentPlan: CatalogPlan | null;
  activePlanLabel: string;
  upgradePlans: CatalogPlan[];
  downgradePlans: CatalogPlan[];
  layout?: "page" | "dialog";
  onPlanSelect: (planIdOrName: string) => void;
  isFirstTime?: boolean;
  isExpired?: boolean;
};

function planGridClass(layout: "page" | "dialog", singleColumn?: boolean) {
  if (singleColumn) {
    return layout === "dialog" ? "max-w-sm mx-auto w-full" : "max-w-md";
  }
  return layout === "dialog"
    ? "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3"
    : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
}

function planItemWrapClass(layout: "page" | "dialog") {
  return layout === "dialog"
    ? "min-w-[220px] max-w-[260px] shrink-0 snap-center md:min-w-0 md:max-w-none"
    : undefined;
}

function PlanGrid({
  plans,
  layout,
  action,
  onPlanSelect,
}: {
  plans: CatalogPlan[];
  layout: "page" | "dialog";
  action: PlanCardAction;
  onPlanSelect: (id: string) => void;
}) {
  return (
    <div className={planGridClass(layout)}>
      {plans.map((plan) => (
        <div key={plan.id || plan.name} className={planItemWrapClass(layout)}>
          <PlanCard
            plan={plan}
            action={action}
            compact={layout === "dialog"}
            onSelect={() => onPlanSelect(plan.id || plan.name)}
          />
        </div>
      ))}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function PlanCatalogSections({
  currentPlan,
  activePlanLabel,
  upgradePlans,
  downgradePlans,
  layout = "page",
  onPlanSelect,
  isFirstTime,
  isExpired,
}: Props) {
  const showAllPlans = isFirstTime || isExpired;
  const sectionTitle = showAllPlans ? "Available plans" : "Upgrade";
  const sectionDescription = showAllPlans
    ? "Choose a plan to get started."
    : "Move to a higher tier for more limits and features. Payment opens after you choose a plan.";
  const planAction = showAllPlans ? ("subscribe" as const) : ("upgrade" as const);
  return (
    <div className="space-y-8">
      <section>
        <SectionHeading
          title="Your current plan"
          description="This is the plan billing and entitlements use today."
        />
        {currentPlan ? (
          <div className={planGridClass(layout, true)}>
            <div className={planItemWrapClass(layout)}>
              <PlanCard
                plan={currentPlan}
                action="current"
                compact={layout === "dialog"}
                onSelect={() => {}}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activePlanLabel}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Active on your pharmacy account. Compare upgrade and downgrade
                options below.
              </p>
            </div>
          </div>
        )}
      </section>

      {upgradePlans.length > 0 ? (
        <section>
          <SectionHeading
            title={sectionTitle}
            description={sectionDescription}
          />
          <PlanGrid
            plans={upgradePlans}
            layout={layout}
            action={planAction}
            onPlanSelect={onPlanSelect}
          />
        </section>
      ) : null}

      {downgradePlans.length > 0 ? (
        <section>
          <SectionHeading
            title="Downgrade"
            description="Switch to a lower tier at your next renewal — your current plan stays active until then."
          />
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <ArrowDown className="size-3.5 shrink-0" />
            Downgrades are scheduled for the end of your billing period, not immediate.
          </div>
          <PlanGrid
            plans={downgradePlans}
            layout={layout}
            action="downgrade"
            onPlanSelect={onPlanSelect}
          />
        </section>
      ) : null}

      {upgradePlans.length === 0 && downgradePlans.length === 0 && currentPlan ? (
        <p className="text-center text-sm text-muted-foreground">
          You are on the only available tier, or no other plans are configured.
        </p>
      ) : null}
    </div>
  );
}
