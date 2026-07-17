import {
  resolveActivePharmacyContext,
  type ActivePharmacyContext,
} from "@/lib/pharmacy/active-pharmacy";
import { resolveDataBranchScope } from "@/lib/pharmacy/staff-branch-access";

export async function resolveSessionBranchContext(
  userId: string,
): Promise<ActivePharmacyContext> {
  return resolveActivePharmacyContext(userId);
}

/**
 * Active working location for the user.
 * Always staff-scoped: assigned staff cannot fall back to HQ/other outlets.
 */
export async function requireUserBranchId(userId: string): Promise<string> {
  const ctx = await resolveActivePharmacyContext(userId);
  if (!ctx.activeBranchId) {
    throw new Error(
      "No active branch. Ask an owner to assign you a location, or select one in the top bar.",
    );
  }
  return ctx.activeBranchId;
}

/** Active branch within the active pharmacy, or throws. */
export async function requireSessionBranchId(userId: string): Promise<string> {
  return requireUserBranchId(userId);
}

/**
 * Branch for a request: client override if allowed, else session.
 * Restricted staff cannot use another outlet via query/body.
 */
export async function requireAllowedRequestBranchId(
  userId: string,
  requestedBranchId?: string | null,
): Promise<string> {
  const ctx = await resolveActivePharmacyContext(userId);
  if (!ctx.activePharmacyId) {
    throw new Error("Pharmacy not found for this account");
  }

  const { branchId } = await resolveDataBranchScope(
    userId,
    ctx.activePharmacyId,
    ctx.role,
    requestedBranchId || ctx.activeBranchId,
    ctx.activeBranchId,
  );

  if (!branchId) {
    throw new Error(
      "No active branch. Ask an owner to assign you a location, or select one in the top bar.",
    );
  }
  return branchId;
}

/**
 * Optional branch filter for reports/inventory lists.
 * Unrestricted + no request → null (all branches).
 * Restricted + no request → pinned to their allowed active branch.
 */
export async function resolveRequestBranchScope(
  userId: string,
  requestedBranchId?: string | null,
): Promise<{
  pharmacyId: string;
  branchId: string | null;
  allowedBranchIds: string[] | null;
}> {
  const ctx = await resolveActivePharmacyContext(userId);
  if (!ctx.activePharmacyId) {
    throw new Error("Pharmacy not found for this account");
  }

  const scoped = await resolveDataBranchScope(
    userId,
    ctx.activePharmacyId,
    ctx.role,
    requestedBranchId,
    ctx.activeBranchId,
  );

  return {
    pharmacyId: ctx.activePharmacyId,
    branchId: scoped.branchId,
    allowedBranchIds: scoped.allowedBranchIds,
  };
}
