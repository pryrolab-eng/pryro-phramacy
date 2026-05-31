"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardFeatureLock } from "@/components/dashboard";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { hasPermission } from "@/lib/rbac/permissions";
import { resolveRoutePermission } from "@/lib/rbac/route-permissions";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { isStaffWorkspaceRole } from "@/lib/rbac/pharmacy-roles";

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks tenant admin routes (staff directory, branches, owner settings, billing)
 * when the user's RBAC permissions do not include the required capability.
 */
export function StaffRoleRouteGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { context, isHydrating, hasSnapshot } = useActivePharmacy();

  const requiredPermission = useMemo(
    () => resolveRoutePermission(pathname),
    [pathname],
  );

  const allowed = useMemo(() => {
    if (!requiredPermission) return true;
    return hasPermission(context.permissions, requiredPermission);
  }, [requiredPermission, context.permissions]);

  if (!hasSnapshot && isHydrating) {
    return null;
  }

  if (requiredPermission && !allowed) {
    const home = isStaffWorkspaceRole(context.role)
      ? PHARMACY_ROUTES.staffDashboard
      : PHARMACY_ROUTES.dashboard;

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md">
          <DashboardFeatureLock
            title="Access restricted"
            description="This area is only available to your pharmacy owner or manager."
            actionLabel="Back to dashboard"
            onAction={() => router.replace(home)}
            minHeight={false}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
