import type { SupabaseClient } from "@supabase/supabase-js";

const UNRESTRICTED_ROLES = new Set(["pharmacy_owner", "admin"]);

/**
 * Branch IDs the user may switch to for this pharmacy.
 * `null` = all active branches allowed.
 * `[]` = no branch access.
 */
export async function getStaffAllowedBranchIds(
  admin: SupabaseClient,
  userId: string,
  pharmacyId: string,
  role: string | null,
): Promise<string[] | null> {
  if (role && UNRESTRICTED_ROLES.has(role)) {
    return null;
  }

  const { data: membership, error: memErr } = await admin
    .from("pharmacy_users")
    .select("id")
    .eq("user_id", userId)
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .maybeSingle();

  if (memErr) throw new Error(memErr.message);
  if (!membership?.id) return [];

  const { data: assignments, error: assignErr } = await admin
    .from("staff_branch_assignments")
    .select("branch_id")
    .eq("pharmacy_user_id", membership.id);

  if (assignErr) throw new Error(assignErr.message);
  if (!assignments?.length) return null;

  return assignments.map((r) => r.branch_id as string);
}

export async function assertBranchAllowedForUser(
  admin: SupabaseClient,
  userId: string,
  pharmacyId: string,
  role: string | null,
  branchId: string,
): Promise<void> {
  const allowed = await getStaffAllowedBranchIds(admin, userId, pharmacyId, role);
  if (allowed === null) return;
  if (!allowed.includes(branchId)) {
    throw new Error("You do not have access to this branch");
  }
}
