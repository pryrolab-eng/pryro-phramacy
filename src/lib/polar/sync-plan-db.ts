import { updateSubscriptionPlanFromDb } from "@/lib/db/admin";
import { syncPlanToPolar, type PlanForPolarSync } from "./sync-plan";
import { isPolarConfigured } from "./client";

/** Sync plan to Polar and persist polar_product_id. Re-run after renames or price changes. */
export async function syncPlanToPolarAndSave(
  plan: PlanForPolarSync,
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

  try {
    const updated = await updateSubscriptionPlanFromDb(plan.id, {
      polar_product_id: result.polarProductId,
    });
    return {
      plan: (updated ?? {
        ...plan,
        polar_product_id: result.polarProductId,
      }) as PlanForPolarSync,
      polarSync: { action: result.action },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      plan: { ...plan, polar_product_id: result.polarProductId },
      polarSync: {
        action: result.action,
        error: msg,
      },
    };
  }
}
