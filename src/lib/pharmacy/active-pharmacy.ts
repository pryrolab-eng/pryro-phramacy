import { prisma } from "@/lib/db/prisma";
import {
  storeListActiveMembershipsWithPharmacyName,
} from "@/lib/db/pharmacy-users-store";
import {
  storeGetUserActiveContext,
  storeUpdateUserActiveContext,
} from "@/lib/db/public-users-store";
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
import { ensureHeadquartersBranch } from "@/lib/pharmacy/branch-hq";
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
  userId: string,
): Promise<PharmacyMembershipDetail[]> {
  return storeListActiveMembershipsWithPharmacyName(userId);
}

async function persistActiveContext(
  userId: string,
  pharmacyId: string | null,
  branchId: string | null,
) {
  await storeUpdateUserActiveContext(userId, pharmacyId, branchId);
}

export async function resolveActivePharmacyId(
  userId: string,
): Promise<string | null> {
  const ctx = await resolveActivePharmacyContext(userId);
  return ctx.activePharmacyId;
}

export async function resolveActivePharmacyContext(
  userId: string,
): Promise<ActivePharmacyContext> {
  const memberships = await loadMemberships(userId);
  if (memberships.length === 0) {
    return {
      activePharmacyId: null,
      activeBranchId: null,
      role: null,
      memberships: [],
    };
  }

  const userRow = await storeGetUserActiveContext(userId);

  let activePharmacyId = userRow?.active_pharmacy_id ?? null;
  let activeBranchId = userRow?.active_branch_id ?? null;

  const memberPharmacyIds = new Set(
    memberships.map((m) => m.pharmacy_id).filter(Boolean) as string[],
  );

  if (!activePharmacyId || !memberPharmacyIds.has(activePharmacyId)) {
    const primary = selectPrimaryMembership(memberships);
    activePharmacyId = primary?.pharmacy_id ?? memberships[0].pharmacy_id ?? null;
    activeBranchId = activePharmacyId
      ? await ensureHeadquartersBranch(activePharmacyId)
      : null;
    if (activePharmacyId) {
      await persistActiveContext(userId, activePharmacyId, activeBranchId);
    }
  } else if (activeBranchId) {
    const branch = await prisma.branches.findUnique({
      where: { id: activeBranchId },
      select: { pharmacy_id: true },
    });
    if (branch?.pharmacy_id !== activePharmacyId) {
      activeBranchId = await ensureHeadquartersBranch(activePharmacyId);
      await persistActiveContext(userId, activePharmacyId, activeBranchId);
    }
  } else {
    activeBranchId = await ensureHeadquartersBranch(activePharmacyId);
    if (activeBranchId) {
      await persistActiveContext(userId, activePharmacyId, activeBranchId);
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
  userId: string,
  pharmacyId: string,
): Promise<ActivePharmacyContext> {
  const memberships = await loadMemberships(userId);
  const allowed = memberships.some((m) => m.pharmacy_id === pharmacyId);
  if (!allowed) {
    throw new Error("You do not have access to this pharmacy");
  }

  const branchId = await ensureHeadquartersBranch(pharmacyId);
  await persistActiveContext(userId, pharmacyId, branchId);

  return resolveActivePharmacyContext(userId);
}

export async function setActiveBranchId(
  userId: string,
  branchId: string,
): Promise<ActivePharmacyContext> {
  const ctx = await resolveActivePharmacyContext(userId);
  if (!ctx.activePharmacyId) {
    throw new Error("No active pharmacy");
  }

  const branch = await prisma.branches.findUnique({
    where: { id: branchId },
    select: { id: true, pharmacy_id: true, is_active: true },
  });

  if (
    !branch ||
    branch.pharmacy_id !== ctx.activePharmacyId ||
    !branch.is_active
  ) {
    throw new Error("Invalid branch for the active pharmacy");
  }

  await assertBranchAllowedForUser(
    userId,
    ctx.activePharmacyId,
    ctx.role,
    branchId,
  );

  const [entitlements, rawBranches, capacity, allowedBranchIds] =
    await Promise.all([
      resolvePharmacyEntitlements(ctx.activePharmacyId),
      getPharmacyBranches(ctx.activePharmacyId),
      getBranchCapacity(ctx.activePharmacyId),
      getStaffAllowedBranchIds(userId, ctx.activePharmacyId, ctx.role),
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

  await persistActiveContext(userId, ctx.activePharmacyId, branchId);
  return resolveActivePharmacyContext(userId);
}

export async function resolveActivePharmacyIdForUser(
  userId: string,
): Promise<string | null> {
  return resolveActivePharmacyId(userId);
}
