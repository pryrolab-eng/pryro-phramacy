"use client";

import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { DashboardSectionCard } from "@/components/dashboard";

export function StaffSettingsAccountPanel() {
  const { context } = useActivePharmacy();
  const displayName = context.user.fullName?.trim() || "—";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <p className="text-sm text-muted-foreground">
          Your Pryrox login. Profile name changes are managed by your pharmacy
          owner from the staff directory.
        </p>
      </div>

      <DashboardSectionCard title="Profile">
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Display name</dt>
            <dd className="font-medium">{displayName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="font-medium break-all">{context.user.email ?? "—"}</dd>
          </div>
        </dl>
      </DashboardSectionCard>
    </div>
  );
}
