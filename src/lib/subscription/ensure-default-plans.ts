import { prisma } from "@/lib/db/prisma";
import { DEFAULT_SUBSCRIPTION_PLANS } from "./default-plans";

/** Inserts missing catalog plans (by name). Safe to call on every empty fetch. */
export async function ensureDefaultSubscriptionPlans(): Promise<void> {
  const existing = await prisma.subscription_plans.findMany({
    where: { is_active: true },
    select: { name: true },
  });

  const names = new Set(
    existing.map((row) => String(row.name).toLowerCase()),
  );

  const missing = DEFAULT_SUBSCRIPTION_PLANS.filter(
    (plan) => !names.has(plan.name.toLowerCase()),
  );

  if (missing.length === 0) {
    return;
  }

  await prisma.subscription_plans.createMany({
    data: missing.map((plan) => ({
      name: plan.name,
      price: plan.price,
      period: plan.period,
      features: plan.features,
      is_popular: plan.is_popular,
      is_active: true,
      plan_type: "main",
      billing_period: plan.price === 0 ? "free" : "monthly",
      max_branches: plan.max_branches ?? 1,
      max_users: plan.max_users ?? 5,
      monthly_tx_limit: plan.monthly_tx_limit ?? 500,
    })),
  });
}
