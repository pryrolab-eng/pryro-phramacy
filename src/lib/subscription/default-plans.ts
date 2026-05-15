export type SubscriptionPlanRow = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
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
  },
];

export function fallbackPlansForDisplay(): SubscriptionPlanRow[] {
  return DEFAULT_SUBSCRIPTION_PLANS.map((plan, index) => ({
    ...plan,
    id: `fallback-${index + 1}`,
    is_active: true,
  }));
}
