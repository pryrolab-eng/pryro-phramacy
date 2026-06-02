import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "../../../supabase/service";
import {
  selectPrimaryMembership,
  type PharmacyMembership,
} from "@/utils/select-pharmacy-membership";
import {
  assertBranchAllowedForUser,
  getStaffAllowedBranchIds,
} from "@/lib/pharmacy/staff-branch-access";
import { resolveSwitcherBranches } from "@/lib/branches/entitled-branches";
import { getBranchCapacity } from "@/lib/subscription/branch-addon-capacity";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";
import { getPharmacyBranches } from "@/lib/saas/subscription-engine";

export type PharmacyMembershipDetail = PharmacyMembership & {
  pharmacy_name: string | null;
};

export type ActivePharmacyContext = {
  activePharmacyId: string | null;
  activeBranchId: string | null;
  role: string | null;
  memberships: PharmacyMembershipDetail[];
};

async function loadMemberships(
  admin: SupabaseClient,
  userId: string,
): Promise<PharmacyMembershipDetail[]> {
  const { data, error } = await admin
    .from("pharmacy_users")
    .select("pharmacy_id, role, pharmacies(name)")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.pharmacy_id)
    .map((row) => {
      const join = row.pharmacies as { name?: string } | { name?: string }[] | null;
      const name = Array.isArray(join) ? join[0]?.name : join?.name;
      return {
        pharmacy_id: row.pharmacy_id as string,
        role: row.role as string,
        pharmacy_name: name ?? null,
      };
    });
}

async function persistActiveContext(
  admin: SupabaseClient,
  userId: string,
  pharmacyId: string | null,
  branchId: string | null,
) {
  const { error } = await admin
    .from("users")
    .update({
      active_pharmacy_id: pharmacyId,
      active_branch_id: branchId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

async function defaultBranchForPharmacy(
  admin: SupabaseClient,
  pharmacyId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("branches")
    .select("id")
    .eq("pharmacy_id", pharmacyId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function resolveActivePharmacyId(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const ctx = await resolveActivePharmacyContext(admin, userId);
  return ctx.activePharmacyId;
}

export async function resolveActivePharmacyContext(
  admin: SupabaseClient,
  userId: string,
): Promise<ActivePharmacyContext> {
  const memberships = await loadMemberships(admin, userId);
  if (memberships.length === 0) {
    return {
      activePharmacyId: null,
      activeBranchId: null,
      role: null,
      memberships: [],
    };
  }

  const { data: userRow } = await admin
    .from("users")
    .select("active_pharmacy_id, active_branch_id")
    .eq("id", userId)
    .maybeSingle();

  let activePharmacyId = userRow?.active_pharmacy_id as string | null;
  let activeBranchId = userRow?.active_branch_id as string | null;

  const memberPharmacyIds = new Set(
    memberships.map((m) => m.pharmacy_id).filter(Boolean) as string[],
  );

  if (!activePharmacyId || !memberPharmacyIds.has(activePharmacyId)) {
    const primary = selectPrimaryMembership(memberships);
    activePharmacyId = primary?.pharmacy_id ?? memberships[0].pharmacy_id ?? null;
    activeBranchId = activePharmacyId
      ? await defaultBranchForPharmacy(admin, activePharmacyId)
      : null;
    if (activePharmacyId) {
      await persistActiveContext(admin, userId, activePharmacyId, activeBranchId);
    }
  } else if (activeBranchId) {
    const { data: branch } = await admin
      .from("branches")
      .select("pharmacy_id")
      .eq("id", activeBranchId)
      .maybeSingle();
    if (branch?.pharmacy_id !== activePharmacyId) {
      activeBranchId = await defaultBranchForPharmacy(admin, activePharmacyId);
      await persistActiveContext(admin, userId, activePharmacyId, activeBranchId);
    }
  } else {
    activeBranchId = await defaultBranchForPharmacy(admin, activePharmacyId);
    if (activeBranchId) {
      await persistActiveContext(admin, userId, activePharmacyId, activeBranchId);
    }
  }

  const role =
    memberships.find((m) => m.pharmacy_id === activePharmacyId)?.role ?? null;

  return {
    activePharmacyId,
    activeBranchId,
    role,
    memberships,
  };
}

export async function setActivePharmacyId(
  admin: SupabaseClient,
  userId: string,
  pharmacyId: string,
): Promise<ActivePharmacyContext> {
  const memberships = await loadMemberships(admin, userId);
  const allowed = memberships.some((m) => m.pharmacy_id === pharmacyId);
  if (!allowed) {
    throw new Error("You do not have access to this pharmacy");
  }

  const branchId = await defaultBranchForPharmacy(admin, pharmacyId);
  await persistActiveContext(admin, userId, pharmacyId, branchId);

  return resolveActivePharmacyContext(admin, userId);
}

export async function setActiveBranchId(
  admin: SupabaseClient,
  userId: string,
  branchId: string,
): Promise<ActivePharmacyContext> {
  const ctx = await resolveActivePharmacyContext(admin, userId);
  if (!ctx.activePharmacyId) {
    throw new Error("No active pharmacy");
  }

  const { data: branch, error } = await admin
    .from("branches")
    .select("id, pharmacy_id, is_active")
    .eq("id", branchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!branch || branch.pharmacy_id !== ctx.activePharmacyId || !branch.is_active) {
    throw new Error("Invalid branch for the active pharmacy");
  }

  await assertBranchAllowedForUser(
    admin,
    userId,
    ctx.activePharmacyId,
    ctx.role,
    branchId,
  );

  const [entitlements, rawBranches, capacity, allowedBranchIds] =
    await Promise.all([
      resolvePharmacyEntitlements(admin, ctx.activePharmacyId),
      getPharmacyBranches(admin, ctx.activePharmacyId),
      getBranchCapacity(admin, ctx.activePharmacyId),
      getStaffAllowedBranchIds(
        admin,
        userId,
        ctx.activePharmacyId,
        ctx.role,
      ),
    ]);

  if (!entitlements.isAccessAllowed) {
    throw new Error(
      "Branch switching is disabled while pharmacy access is paused",
    );
  }

  const entitled = resolveSwitcherBranches({
    branches: rawBranches,
    maxSlots: capacity.totalSlots,
    allowedBranchIds,
    activeBranchId: ctx.activeBranchId,
    accessBlocked: false,
  });

  if (!entitled.some((b) => b.id === branchId)) {
    throw new Error("This branch is not included in your current plan");
  }

  await persistActiveContext(admin, userId, ctx.activePharmacyId, branchId);
  return resolveActivePharmacyContext(admin, userId);
}

export async function resolveActivePharmacyIdForUser(
  userId: string,
): Promise<string | null> {
  const admin = createServiceClient();
  return resolveActivePharmacyId(admin, userId);
}
