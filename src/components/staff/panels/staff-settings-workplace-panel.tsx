"use client";

import { Building2, GitBranch, Mail, Phone } from "lucide-react";
import { useMeWorkplace } from "@/hooks/useMeWorkplace";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { DashboardPageLoading, DashboardSectionCard } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export function StaffSettingsWorkplacePanel() {
  const workplaceQuery = useMeWorkplace();
  const { context } = useActivePharmacy();

  if (workplaceQuery.isPending) {
    return <DashboardPageLoading label="Loading workplace…" />;
  }

  if (workplaceQuery.isError || !workplaceQuery.data?.pharmacy) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Could not load workplace details.
      </p>
    );
  }

  const { pharmacy, membership, branchAccess } = workplaceQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Workplace</h2>
        <p className="text-sm text-muted-foreground">
          Read-only details for the pharmacy you work at. Contact your owner to
          change business information.
        </p>
      </div>

      <DashboardSectionCard title="Pharmacy" description="Your organization">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd className="font-medium">{pharmacy.name}</dd>
          </div>
          {pharmacy.licenseNumber ? (
            <div>
              <dt className="text-xs text-muted-foreground">License</dt>
              <dd className="font-medium">{pharmacy.licenseNumber}</dd>
            </div>
          ) : null}
          {pharmacy.location ? (
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="font-medium">{pharmacy.location}</dd>
            </div>
          ) : null}
          {pharmacy.phone ? (
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-medium">{pharmacy.phone}</dd>
              </div>
            </div>
          ) : null}
          {pharmacy.businessEmail ? (
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Business email</dt>
                <dd className="font-medium break-all">{pharmacy.businessEmail}</dd>
              </div>
            </div>
          ) : null}
        </dl>
      </DashboardSectionCard>

      <DashboardSectionCard title="Your access" description="Role and branches">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd>
              <Badge variant="secondary">{membership.roleLabel}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sign-in email</dt>
            <dd className="font-medium break-all">{context.user.email ?? "—"}</dd>
          </div>
          {branchAccess.activeBranch ? (
            <div className="flex items-start gap-2">
              <GitBranch className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Active branch</dt>
                <dd className="font-medium">
                  {branchAccess.activeBranch.name}
                  {branchAccess.activeBranch.isMain ? " (main)" : ""}
                </dd>
              </div>
            </div>
          ) : null}
          <div>
            <dt className="mb-2 text-xs text-muted-foreground">Branch access</dt>
            <dd>
              {branchAccess.unrestricted ? (
                <p className="text-sm text-muted-foreground">
                  All branches — use the branch switcher in the header to change
                  location.
                </p>
              ) : branchAccess.branches.length === 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  No branches assigned. Ask your pharmacy owner for access.
                </p>
              ) : (
                <ul className="space-y-1">
                  {branchAccess.branches.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <Building2 className="size-3.5 text-muted-foreground" />
                      {b.name}
                      {b.isMain ? (
                        <span className="text-xs text-muted-foreground">(main)</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>
      </DashboardSectionCard>
    </div>
  );
}
