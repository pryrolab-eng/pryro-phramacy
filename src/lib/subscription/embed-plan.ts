/**
 * PostgREST embed hint for the current catalog plan on subscriptions.
 * Required because subscriptions.plan_id and subscriptions.next_plan_id
 * both reference subscription_plans (ambiguous without a hint).
 */
export const SUBSCRIPTION_CURRENT_PLAN_EMBED = "subscription_plans!plan_id";
