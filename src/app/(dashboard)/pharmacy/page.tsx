import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { selectPrimaryMembership } from "@/utils/select-pharmacy-membership";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { isStaffWorkspaceRole } from "@/lib/rbac/pharmacy-roles";
import { storeListActiveMembershipsForUser } from "@/lib/db/pharmacy-users-store";

/** Tenant root — redirect to role-appropriate home under /pharmacy. */
export default async function PharmacyRootPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  const membershipRows = await storeListActiveMembershipsForUser(user.id);
  const membership = selectPrimaryMembership(membershipRows);
  const role = membership?.role;

  if (isStaffWorkspaceRole(role)) {
    redirect(PHARMACY_ROUTES.staffDashboard);
  }
  redirect(PHARMACY_ROUTES.dashboard);
}
