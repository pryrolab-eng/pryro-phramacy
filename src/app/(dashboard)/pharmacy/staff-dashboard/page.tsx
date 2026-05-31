"use client";

import Link from "next/link";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useMeWorkplace } from "@/hooks/useMeWorkplace";
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardSectionCard,
  DashboardPageLoading,
  DashboardButton,
  DashboardMetricGrid,
  DashboardStatCard,
} from "@/components/dashboard";
import { getStaffWorkspaceNavItems } from "@/lib/rbac/staff-workspace-nav";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { formatPharmacyRoleLabel } from "@/lib/rbac/pharmacy-roles";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { useMeStaffDashboard } from "@/hooks/useMeStaffDashboard";
import { ArrowRight, Building2, GitBranch, Activity } from "lucide-react";

export default function StaffDashboardPage() {
  const { context } = useActivePharmacy();
  const workplaceQuery = useMeWorkplace();
  const summaryQuery = useMeStaffDashboard();
  const { can, isEntitlementsReady } = usePharmacyEntitlements();
  const role = context.role;
  const navItems = getStaffWorkspaceNavItems(role, context.permissions).filter(
    (item) => item.url !== PHARMACY_ROUTES.staffDashboard,
  );

  if (workplaceQuery.isPending || summaryQuery.isPending) {
    return <DashboardPageLoading label="Loading your workspace…" />;
  }

  const workplace = workplaceQuery.data;
  const pharmacyName =
    workplace?.pharmacy?.name ??
    context.memberships.find((m) => m.pharmacyId === context.activePharmacyId)
      ?.pharmacyName ??
    "Pharmacy";

  return (
    <FeatureGate featureKey="app.dashboard">
      <DashboardPageShell>
        <DashboardPageHeader
          title="Dashboard"
          description={`${formatPharmacyRoleLabel(role)} workspace`}
        />

        {summaryQuery.data?.metrics?.length ? (
          <DashboardMetricGrid>
            {summaryQuery.data.metrics.map((metric) => (
              <DashboardStatCard
                key={metric.key}
                label={metric.label}
                icon={Activity}
                value={metric.value}
                hint={metric.hint}
              />
            ))}
          </DashboardMetricGrid>
        ) : null}

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          <DashboardSectionCard title="Your workplace">
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Pharmacy</dt>
                <dd className="flex items-center gap-2 font-medium">
                  <Building2 className="size-4 text-muted-foreground" />
                  {pharmacyName}
                </dd>
              </div>
              {workplace?.branchAccess.activeBranch ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Active branch</dt>
                  <dd className="flex items-center gap-2 font-medium">
                    <GitBranch className="size-4 text-muted-foreground" />
                    {workplace.branchAccess.activeBranch.name}
                    {workplace.branchAccess.activeBranch.isMain ? " (main)" : ""}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="font-medium">
                  {workplace?.membership.roleLabel ??
                    formatPharmacyRoleLabel(role)}
                </dd>
              </div>
            </dl>
            <DashboardButton
              tone="outline"
              size="sm"
              className="mt-4"
              asChild
            >
              <Link href={PHARMACY_ROUTES.staffSettings}>
                My settings
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </DashboardButton>
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Quick actions"
            description="Based on your role and plan"
          >
            <ul className="space-y-2">
              {navItems.map((item) => {
                const allowed =
                  !isEntitlementsReady || can(item.featureKey);
                const Icon = item.icon;
                return (
                  <li key={item.url}>
                    <Link
                      href={allowed ? item.url : PHARMACY_ROUTES.billing}
                      className="flex items-center justify-between rounded-lg border border-neutral-200/80 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        {item.title}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </DashboardSectionCard>
        </div>
      </DashboardPageShell>
    </FeatureGate>
  );
}
