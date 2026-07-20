import type { AuthUser } from "@/lib/auth/types";
import { readMustChangePasswordFromDb } from "@/lib/auth/must-change-password";
import { resolveHomePathFromMeContext } from "@/lib/auth/resolve-home-redirect";
import type { SessionBootstrapPayload } from "@/lib/auth/session-bootstrap-types";
import { storeGetPublicUserProfile } from "@/lib/db/public-users-store";
import type { MeContextResponse } from "@/lib/http/me-context";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import { getStaffAllowedBranchIds } from "@/lib/pharmacy/staff-branch-access";
import { loadRolePermissions } from "@/lib/rbac/permissions";

export type { SessionBootstrapPayload } from "@/lib/auth/session-bootstrap-types";

export async function buildMeContextResponse(
  user: Pick<AuthUser, "id" | "email">,
): Promise<MeContextResponse> {
  const [ctx, profile, mustChangePassword] = await Promise.all([
    resolveActivePharmacyContext(user.id),
    storeGetPublicUserProfile(user.id),
    readMustChangePasswordFromDb(user.id),
  ]);

  let allowedBranchIds: string[] | null = null;
  let permissions: string[] = [];
  if (ctx.activePharmacyId) {
    [allowedBranchIds, permissions] = await Promise.all([
      getStaffAllowedBranchIds(user.id, ctx.activePharmacyId, ctx.role),
      loadRolePermissions(ctx.role),
    ]);
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      isPlatformAdmin: profile?.is_platform_admin === true,
    },
    activePharmacyId: ctx.activePharmacyId,
    activeBranchId: ctx.activeBranchId,
    role: ctx.role,
    allowedBranchIds,
    permissions,
    mustChangePassword,
    memberships: ctx.memberships
      .filter((m): m is typeof m & { pharmacy_id: string } =>
        Boolean(m.pharmacy_id),
      )
      .map((m) => ({
        pharmacyId: m.pharmacy_id,
        pharmacyName: m.pharmacy_name,
        role: m.role,
        isActive: m.pharmacy_id === ctx.activePharmacyId,
      })),
  };
}

/**
 * Keep bootstrap light: enough to resolve auth state, route, and basic access.
 * Heavier dashboard/subscription queries load after navigation via normal hooks.
 */
export async function buildSessionBootstrap(
  user: Pick<AuthUser, "id" | "email">,
): Promise<SessionBootstrapPayload | { ok: false; reason: string }> {
  const me = await buildMeContextResponse(user);
  const path = await resolveHomePathFromMeContext(user.id, me);

  return {
    ok: true,
    path,
    mustChangePassword: me.mustChangePassword,
    me,
    // Bootstrap should be fast and unblock redirect; entitlements are fetched on-demand after mount.
    entitlements: null,
    dashboard: null,
    subscription: null,
    plans: null,
    staff: null,
  };
}
