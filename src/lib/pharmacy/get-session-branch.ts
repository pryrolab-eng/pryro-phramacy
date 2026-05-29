import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveActivePharmacyContext,
  type ActivePharmacyContext,
} from "@/lib/pharmacy/active-pharmacy";
import { createServiceClient } from "../../../supabase/service";

export async function resolveSessionBranchContext(
  _supabase: SupabaseClient,
  userId: string,
): Promise<ActivePharmacyContext> {
  const admin = createServiceClient();
  return resolveActivePharmacyContext(admin, userId);
}

/** Active branch within the active pharmacy, or throws. */
export async function requireSessionBranchId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const ctx = await resolveSessionBranchContext(supabase, userId);
  if (!ctx.activeBranchId) {
    throw new Error("No active branch. Select a branch in the top bar.");
  }
  return ctx.activeBranchId;
}
