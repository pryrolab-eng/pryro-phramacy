import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { selectPrimaryMembership } from "@/utils/select-pharmacy-membership";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { isStaffWorkspaceRole } from "@/lib/rbac/pharmacy-roles";

/** Tenant root — redirect to role-appropriate home under /pharmacy. */
export default async function PharmacyRootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: membershipRows } = await supabase
    .from("pharmacy_users")
    .select("role, pharmacy_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const membership = selectPrimaryMembership(membershipRows ?? undefined);
  const role = membership?.role;

  if (isStaffWorkspaceRole(role)) {
    redirect(PHARMACY_ROUTES.staffDashboard);
  }
  redirect(PHARMACY_ROUTES.dashboard);
}
