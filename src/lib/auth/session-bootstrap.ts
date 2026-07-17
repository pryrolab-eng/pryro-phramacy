import type { AuthUser } from "@/lib/auth/types";
import { readMustChangePasswordFromDb } from "@/lib/auth/must-change-password";
import { resolveAuthenticatedHomePath } from "@/lib/auth/resolve-home-redirect";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import { getStaffAllowedBranchIds } from "@/lib/pharmacy/staff-branch-access";
import { loadRolePermissions } from "@/lib/rbac/permissions";
import { storeGetPublicUserProfile } from "@/lib/db/public-users-store";
import type { MeContextResponse } from "@/lib/http/me-context";
import {
  buildPlatformAdminEntitlementsSnapshot,
  resolvePharmacyEntitlements,
  toEntitlementsSnapshot,
} from "@/lib/subscription/lifecycle/entitlements";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import type { PharmacyEntitlementsSnapshot } from "@/lib/subscription/lifecycle/types";
import type { CombinedDashboardData } from "@/lib/http/pharmacy-dashboard";
import {
  getPharmacySubscriptionSummary,
  getActivePlans,
} from "@/lib/saas/subscription-engine";
import type {
  PharmacySubscriptionSummary,
  SubscriptionPlan,
} from "@/lib/saas/types";
import { storeListPharmacyStaff } from "@/lib/db/staff-store";
import type { StaffUser } from "@/lib/http/staff";
import type { SessionBootstrapPayload } from "@/lib/auth/session-bootstrap-types";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { loadCombinedDashboardData } from "@/lib/pharmacy/load-combined-dashboard";

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
    memberships: ctx.memberships.map((m) => ({
      pharmacyId: m.pharmacy_id,
      pharmacyName: m.pharmacy_name,
      role: m.role,
      isActive: m.pharmacy_id === ctx.activePharmacyId,
    })),
  };
}

function mapStaffRows(
  rows: Awaited<ReturnType<typeof storeListPharmacyStaff>>,
): StaffUser[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone,
    role: row.role,
    status: row.status,
    joinDate: row.joinDate,
  }));
}

/**
 * One server round-trip after login: home path + warm caches for the destination.
 */
export async function buildSessionBootstrap(
  user: Pick<AuthUser, "id" | "email">,
): Promise<SessionBootstrapPayload | { ok: false; reason: string }> {
  const home = await resolveAuthenticatedHomePath(user);
  if (home.kind !== "redirect") {
    return { ok: false, reason: "unauthenticated" };
  }

  const me = await buildMeContextResponse(user);
  const pharmacyId = me.activePharmacyId;
  const isPharmacyDest =
    home.path.startsWith("/pharmacy/") ||
    home.path === PHARMACY_ROUTES.dashboard;

  let entitlements: PharmacyEntitlementsSnapshot | null = null;
  let dashboard: CombinedDashboardData | null = null;
  let subscription: PharmacySubscriptionSummary | null = null;
  let plans: SubscriptionPlan[] | null = null;
  let staff: StaffUser[] | null = null;

  if (me.user.isPlatformAdmin && !pharmacyId) {
    entitlements = await buildPlatformAdminEntitlementsSnapshot();
  } else if (pharmacyId && isPharmacyDest) {
    const critical = await Promise.allSettled([
      resolvePharmacyEntitlements(pharmacyId).then(toEntitlementsSnapshot),
      loadCombinedDashboardData(pharmacyId),
    ]);
    if (critical[0].status === "fulfilled") entitlements = critical[0].value;
    if (critical[1].status === "fulfilled") dashboard = critical[1].value;

    const secondary = await Promise.allSettled([
      getPharmacySubscriptionSummary(pharmacyId),
      getActivePlans(),
      storeListPharmacyStaff(pharmacyId),
    ]);
    if (secondary[0].status === "fulfilled") subscription = secondary[0].value;
    if (secondary[1].status === "fulfilled") plans = secondary[1].value;
    if (secondary[2].status === "fulfilled") {
      staff = mapStaffRows(secondary[2].value);
    }
  } else if (pharmacyId) {
    try {
      entitlements = await toEntitlementsSnapshot(
        await resolvePharmacyEntitlements(pharmacyId),
      );
    } catch {
      entitlements = null;
    }
  } else if (await resolveIsAppPlatformAdmin(user.id)) {
    entitlements = await buildPlatformAdminEntitlementsSnapshot();
  }

  return {
    ok: true,
    path: home.path,
    mustChangePassword: me.mustChangePassword,
    me,
    entitlements,
    dashboard,
    subscription,
    plans,
    staff,
  };
}
