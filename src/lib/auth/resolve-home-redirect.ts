import type { AuthUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { isStaffWorkspaceRole } from "@/lib/rbac/pharmacy-roles";
import { selectPrimaryMembership } from "@/utils/select-pharmacy-membership";
import {
  storeListActiveMembershipsForUser,
  storeUpsertPharmacyMembership,
} from "@/lib/db/pharmacy-users-store";
import { storeGetIsPlatformAdmin } from "@/lib/db/public-users-store";

/** Post-login entry URL — role router only; not a workspace UI. */
export const POST_AUTH_ENTRY_PATH = "/app";

export type HomeRedirectResult =
  | { kind: "redirect"; path: string }
  | { kind: "unauthenticated" };

/**
 * Resolves where an authenticated user should land after sign-in, OAuth, or 2FA.
 * Platform admins → /admin; tenant roles → /pharmacy/*; no tenant → /onboarding.
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
        // membership repair failed — fall through to onboarding
      }
    }

    if (
      process.env.NODE_ENV !== "production" &&
      user.email?.includes("@test.com")
    ) {
      const role = user.email.includes("pharmacy")
        ? "pharmacy_owner"
        : user.email.includes("pharmacist")
          ? "pharmacist"
          : "cashier";

      try {
        await storeUpsertPharmacyMembership({
          pharmacyId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          userId: user.id,
          role,
        });
        return {
          kind: "redirect",
          path:
            isStaffWorkspaceRole(role)
              ? PHARMACY_ROUTES.staffDashboard
              : PHARMACY_ROUTES.dashboard,
        };
      } catch {
        // test seed failed — fall through to onboarding
      }
    }

    return { kind: "redirect", path: "/onboarding" };
  }

  if (isStaffWorkspaceRole(userPharmacy.role)) {
    return { kind: "redirect", path: PHARMACY_ROUTES.staffDashboard };
  }
  return { kind: "redirect", path: PHARMACY_ROUTES.dashboard };
}
