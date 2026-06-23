import {
  checkBranchCanTransact,
  incrementBranchTx,
} from "@/lib/saas/subscription-engine";
import { isEntitlementsEnforced } from "./feature-catalog";
import { resolvePharmacyEntitlements } from "./lifecycle/entitlements";

export class EntitlementError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 403,
    public readonly upgradeFeature?: string,
  ) {
    super(message);
    this.name = "EntitlementError";
  }
}

export type RequireEntitlementInput = {
  pharmacyId: string;
  feature?: string;
  limit?: "users" | "branches";
  branchId?: string;
  /** When true, check and increment branch transaction meter */
  consumeTransaction?: boolean;
};

export async function requirePharmacyEntitlement(
  input: RequireEntitlementInput,
): Promise<void> {
  if (!isEntitlementsEnforced()) return;

  const ent = await resolvePharmacyEntitlements(input.pharmacyId);

  if (!ent.isAccessAllowed) {
    throw new EntitlementError(
      "Active subscription required.",
      "subscription_inactive",
    );
  }

  if (input.feature && !ent.can(input.feature)) {
    throw new EntitlementError(
      "This feature is not included in your plan. Upgrade to unlock it.",
      "feature_not_in_plan",
      403,
      input.feature,
    );
  }

  if (input.limit) {
    const result = ent.withinLimit(input.limit);
    if (!result.allowed) {
      throw new EntitlementError(
        result.reason ?? "Plan limit reached.",
        "limit_reached",
      );
    }
  }

  if (input.consumeTransaction && input.branchId) {
    const check = await checkBranchCanTransact(input.branchId);
    if (!check.allowed) {
      throw new EntitlementError(
        check.message ?? "Monthly transaction limit reached for this branch.",
        "tx_limit_reached",
      );
    }
    const inc = await incrementBranchTx(input.branchId);
    if (!inc.ok) {
      throw new EntitlementError(
        "Could not record transaction against branch usage.",
        "tx_increment_failed",
      );
    }
  }
}

export function entitlementErrorResponse(err: unknown) {
  if (err instanceof EntitlementError) {
    return {
      status: err.status,
      body: {
        error: err.message,
        code: err.code,
        upgradeFeature: err.upgradeFeature,
      },
    };
  }
  return null;
}
