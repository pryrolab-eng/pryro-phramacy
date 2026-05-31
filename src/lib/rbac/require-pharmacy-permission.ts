import { createServiceClient } from "../../../supabase/service";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import {
  hasPermission,
  loadRolePermissions,
  type PharmacyPermission,
} from "@/lib/rbac/permissions";

export class PharmacyPermissionError extends Error {
  readonly status = 403;
  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "PharmacyPermissionError";
  }
}

export async function requirePharmacyPermission(
  userId: string,
  permission: PharmacyPermission,
) {
  const admin = createServiceClient();
  const ctx = await resolveActivePharmacyContext(admin, userId);
  if (!ctx.activePharmacyId) {
    throw new PharmacyPermissionError("Pharmacy not found");
  }
  const permissions = await loadRolePermissions(admin, ctx.role);
  if (!hasPermission(permissions, permission)) {
    throw new PharmacyPermissionError();
  }
  return { admin, ctx, permissions };
}

export function permissionErrorResponse(error: unknown) {
  if (error instanceof PharmacyPermissionError) {
    return {
      body: { success: false, error: error.message, code: "forbidden" },
      status: 403 as const,
    };
  }
  return null;
}
