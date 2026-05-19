import type { SupabaseClient } from "@supabase/supabase-js";
import { syncPlanToPolar, type PlanForPolarSync } from "./sync-plan";
import { isPolarConfigured } from "./client";

/** Sync plan to Polar and persist polar_product_id. Re-run after renames or price changes. */
export async function syncPlanToPolarAndSave(
  db: SupabaseClient,
  plan: PlanForPolarSync
): Promise<{
  plan: PlanForPolarSync & { polar_product_id?: string | null };
  polarSync?: { action: string; error?: string };
}> {
  if (!isPolarConfigured()) {
    return { plan };
  }

  const result = await syncPlanToPolar(plan);

  if (!result.ok) {
    return {
      plan,
      polarSync: { action: "failed", error: result.error },
    };
  }

  if (result.action === "skipped") {
    return { plan, polarSync: { action: "skipped" } };
  }

  const { data: updated, error } = await db
    .from("subscription_plans")
    .update({ polar_product_id: result.polarProductId })
    .eq("id", plan.id)
    .select()
    .single();

  if (error) {
    const msg = error.message ?? "";
    const needsMigration =
      msg.includes("polar_product_id") && msg.includes("schema cache");
    return {
      plan: { ...plan, polar_product_id: result.polarProductId },
      polarSync: {
        action: result.action,
        error: needsMigration
          ? "Database missing polar_product_id column. Run migration supabase/migrations/20250621100000_polar_subscription_payments.sql in Supabase SQL Editor, then sync again."
          : msg,
      },
    };
  }

  return {
    plan: (updated ?? { ...plan, polar_product_id: result.polarProductId }) as PlanForPolarSync,
    polarSync: { action: result.action },
  };
}
