import type { AuthUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import type { MeContextResponse } from "@/lib/http/me-context";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { isStaffWorkspaceRole } from "@/lib/rbac/pharmacy-roles";
import { selectPrimaryMembership } from "@/utils/select-pharmacy-membership";
import {
  storeListActiveMembershipsForUser,
  storeUpsertPharmacyMembership,
} from "@/lib/db/pharmacy-users-store";
import { storeGetIsPlatformAdmin } from "@/lib/db/public-users-store";

/** Post-login entry URL - role router only; not a workspace UI. */
export const POST_AUTH_ENTRY_PATH = "/app";

export type HomeRedirectResult =
  | { kind: "redirect"; path: string }
  | { kind: "unauthenticated" };

function isPlatformAdminFromMemberships(
  me: Pick<MeContextResponse, "user" | "memberships">,
): boolean {
  const primary = selectPrimaryMembership(
    me.memberships.map((m) => ({ pharmacy_id: m.pharmacyId, role: m.role })),
  );
  return (
    me.user.isPlatformAdmin ||
    primary?.role === "superadmin" ||
    primary?.role === "admin"
  );
}

/** Derive post-login path from an already-loaded me context (avoids duplicate membership queries). */
export async function resolveHomePathFromMeContext(
  userId: string,
  me: MeContextResponse,
): Promise<string> {
  if (isPlatformAdminFromMemberships(me)) {
    return "/admin";
  }

  const userPharmacy = selectPrimaryMembership(
    me.memberships.map((m) => ({ pharmacy_id: m.pharmacyId, role: m.role })),
  );

  if (!userPharmacy) {
    const ownedPharmacy = await prisma.pharmacies.findFirst({
      where: { owner_id: userId },
      select: { id: true },
    });

    if (ownedPharmacy?.id) {
      try {
        await storeUpsertPharmacyMembership({
          pharmacyId: ownedPharmacy.id,
          userId,
          role: "pharmacy_owner",
        });
        return PHARMACY_ROUTES.dashboard;
      } catch {
        // Membership repair failed; continue to onboarding.
      }
    }

    return "/onboarding";
  }

  if (isStaffWorkspaceRole(userPharmacy.role)) {
    return PHARMACY_ROUTES.staffDashboard;
  }
  return PHARMACY_ROUTES.dashboard;
}

/**
 * Resolves where an authenticated user should land after sign-in, OAuth, or 2FA.
 * Platform admins go to /admin; tenant roles go to /pharmacy/*; no tenant goes to /onboarding.
 */
export async function resolveAuthenticatedHomePath(
  user: Pick<AuthUser, "id" | "email">,
): Promise<HomeRedirectResult> {
  const [isPlatformAdminFlag, membershipRows] = await Promise.all([
    storeGetIsPlatformAdmin(user.id),
    storeListActiveMembershipsForUser(user.id),
  ]);

  const userPharmacy = selectPrimaryMembership(membershipRows);

  const isPlatformAdmin =
    isPlatformAdminFlag ||
    userPharmacy?.role === "superadmin" ||
    userPharmacy?.role === "admin";

  if (isPlatformAdmin) {
    return { kind: "redirect", path: "/admin" };
  }

  if (!userPharmacy) {
    const ownedPharmacy = await prisma.pharmacies.findFirst({
      where: { owner_id: user.id },
      select: { id: true },
    });

    if (ownedPharmacy?.id) {
      try {
        await storeUpsertPharmacyMembership({
          pharmacyId: ownedPharmacy.id,
          userId: user.id,
          role: "pharmacy_owner",
        });
        return { kind: "redirect", path: PHARMACY_ROUTES.dashboard };
      } catch {
        // Membership repair failed; continue to onboarding.
      }
    }

    return { kind: "redirect", path: "/onboarding" };
  }

  if (isStaffWorkspaceRole(userPharmacy.role)) {
    return { kind: "redirect", path: PHARMACY_ROUTES.staffDashboard };
  }
  return { kind: "redirect", path: PHARMACY_ROUTES.dashboard };
}
