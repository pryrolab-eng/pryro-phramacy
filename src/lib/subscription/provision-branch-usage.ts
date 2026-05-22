import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_TX_LIMIT = 500;

/**
 * Creates or updates branch_usage rows for all active branches under a main subscription.
 * Safe to call repeatedly (RPC uses ON CONFLICT DO UPDATE).
 */
export async function provisionBranchUsageForMainSubscription(
  admin: SupabaseClient,
  params: {
    pharmacyId: string;
    subscriptionId: string;
    planId: string | null;
  }
): Promise<void> {
  const { pharmacyId, subscriptionId, planId } = params;
  if (!planId) return;

  const { data: plan, error: planErr } = await admin
    .from("subscription_plans")
    .select("monthly_tx_limit")
    .eq("id", planId)
    .maybeSingle();

  if (planErr) {
    console.error("provisionBranchUsageForMainSubscription: plan lookup", planErr);
    return;
  }

  const txLimit = Number(plan?.monthly_tx_limit ?? DEFAULT_TX_LIMIT);

  const { data: branches, error: branchErr } = await admin
    .from("branches")
    .select("id")
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true);

  if (branchErr) {
    console.error("provisionBranchUsageForMainSubscription: branches", branchErr);
    return;
  }

  if (!branches?.length) return;

  const results = await Promise.all(
    branches.map((b) =>
      admin.rpc("provision_branch_usage", {
        p_branch_id: b.id as string,
        p_pharmacy_id: pharmacyId,
        p_subscription_id: subscriptionId,
        p_tx_limit: txLimit,
      })
    )
  );

  for (const { error } of results) {
    if (error) {
      console.error("provisionBranchUsageForMainSubscription: rpc", error);
    }
  }
}

/** Provisions usage for a single branch (branch_addon subscriptions). */
export async function provisionBranchUsageForBranch(
  admin: SupabaseClient,
  params: {
    branchId: string;
    pharmacyId: string;
    subscriptionId: string;
    planId: string;
  }
): Promise<void> {
  const { data: plan, error: planErr } = await admin
    .from("subscription_plans")
    .select("monthly_tx_limit")
    .eq("id", params.planId)
    .maybeSingle();

  if (planErr) {
    console.error("provisionBranchUsageForBranch: plan lookup", planErr);
    return;
  }

  const txLimit = Number(plan?.monthly_tx_limit ?? DEFAULT_TX_LIMIT);
  const { error } = await admin.rpc("provision_branch_usage", {
    p_branch_id: params.branchId,
    p_pharmacy_id: params.pharmacyId,
    p_subscription_id: params.subscriptionId,
    p_tx_limit: txLimit,
  });

  if (error) {
    console.error("provisionBranchUsageForBranch: rpc", error);
  }
}
