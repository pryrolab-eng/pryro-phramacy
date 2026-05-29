import type { PlanType } from "@/lib/subscription/normalize-plan";

export type SubscriptionPlanRow = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  plan_type?: PlanType;
  monthly_tx_limit?: number;
  max_users?: number;
  max_branches?: number;
};

export const DEFAULT_SUBSCRIPTION_PLANS: Omit<
  SubscriptionPlanRow,
  "id" | "is_active"
>[] = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    features: [
      "Basic POS",
      "Up to 3 users",
      "Email support",
      "Basic reports",
    ],
    is_popular: false,
    max_branches: 1,
    max_users: 3,
    monthly_tx_limit: 200,
  },
  {
    name: "Standard",
    price: 50000,
    period: "per month",
    features: [
      "Full POS",
      "Up to 10 users",
      "Insurance integration",
      "Phone support",
      "Advanced reports",
    ],
    is_popular: true,
    max_branches: 5,
    max_users: 15,
    monthly_tx_limit: 2000,
  },
  {
    name: "Premium",
    price: 120000,
    period: "per month",
    features: [
      "Everything in Standard",
      "Unlimited users",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
    ],
    is_popular: false,
    max_branches: 15,
    max_users: 50,
    monthly_tx_limit: 5000,
  },
];

export function fallbackPlansForDisplay(): SubscriptionPlanRow[] {
  return DEFAULT_SUBSCRIPTION_PLANS.map((plan, index) => ({
    ...plan,
    id: `fallback-${index + 1}`,
    is_active: true,
    plan_type: "main" as const,
  }));
}
