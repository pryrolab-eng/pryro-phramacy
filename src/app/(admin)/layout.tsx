import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { storeGetIsPlatformAdmin } from "@/lib/db/public-users-store";
import { storeListActiveMembershipsForUser } from "@/lib/db/pharmacy-users-store";
import { selectPrimaryMembership } from "@/utils/select-pharmacy-membership";
import { SidebarInset } from "@/components/ui/sidebar";
import { SuperadminSidebar } from "@/components/superadmin-sidebar";
import { DashboardShellBar } from "@/components/shell/dashboard-shell-bar";
import {
  DashboardMainScroll,
  AdminProviders,
} from "@/components/shell/dashboard-providers";
import { AdminCommandPalette } from "@/components/dashboard";
import { AiSlideOverPanel } from "@/components/ai-panel";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const [isPlatformAdminFlag, membershipRows] = await Promise.all([
    storeGetIsPlatformAdmin(user.id),
    storeListActiveMembershipsForUser(user.id),
  ]);
  const primary = selectPrimaryMembership(membershipRows);
  const isPlatformAdmin =
    isPlatformAdminFlag ||
    primary?.role === "superadmin" ||
    primary?.role === "admin";

  if (!isPlatformAdmin) {
    redirect("/app");
  }

  return (
    <AdminProviders>
      <SuperadminSidebar />
      <SidebarInset className="flex h-svh min-h-0 min-w-0 flex-col overflow-hidden">
        <DashboardShellBar showBranchSwitcher={false} />
        <AdminCommandPalette />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DashboardMainScroll className="min-w-0 flex-1">
            <AdminShell>{children}</AdminShell>
          </DashboardMainScroll>
          <AiSlideOverPanel />
        </div>
      </SidebarInset>
    </AdminProviders>
  );
}
