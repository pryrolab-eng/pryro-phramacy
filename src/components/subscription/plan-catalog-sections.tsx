"use client";

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
  const planAction = showAllPlans ? ("subscribe" as const) : ("upgrade" as const);

  const allPlans: Array<{ plan: CatalogPlan; action: PlanCardAction }> = [];

  for (const plan of downgradePlans) {
    allPlans.push({ plan, action: "downgrade" });
  }

  if (currentPlan) {
    allPlans.push({ plan: currentPlan, action: "current" });
  }

  for (const plan of upgradePlans) {
    allPlans.push({ plan, action: planAction });
  }

  allPlans.sort((a, b) => a.plan.price - b.plan.price);

  return (
    <div className="space-y-4">
      <div className={planGridClass(layout)}>
        {allPlans.map(({ plan, action }) => (
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

      {allPlans.length === 0 && currentPlan ? (
        <p className="text-center text-sm text-muted-foreground">
          You are on the only available tier, or no other plans are configured.
        </p>
      ) : null}
    </div>
  );
}
