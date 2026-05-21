// All subscription plans are managed by the admin through the dashboard
// and stored in the database. There are no hardcoded fallback plans.
// Use the /api/saas/plans endpoint to fetch active plans.

export type SubscriptionPlanRow = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
};
