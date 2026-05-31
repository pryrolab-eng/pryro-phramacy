"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  parseStaffSettingsTab,
  type StaffSettingsTabValue,
} from "@/lib/staff-settings-tabs";
import { DashboardPageLoading } from "@/components/dashboard";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { StaffSettingsShell } from "@/components/staff/staff-settings-shell";
import { StaffSettingsActivePanel } from "@/components/staff/staff-settings-active-panel";
import { StaffSettingsPageProvider } from "@/components/staff/staff-settings-page-provider";
import { StaffSettingsDialogs } from "@/components/staff/staff-settings-dialogs";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";

export default function StaffSettingsPage() {
  return (
    <Suspense fallback={<DashboardPageLoading label="Loading settings…" />}>
      <FeatureGate
        featureKey="settings.access"
        loadingFallback={<DashboardPageLoading label="Loading settings…" />}
      >
        <StaffSettingsPageProvider>
          <StaffSettingsPageInner />
          <StaffSettingsDialogs />
        </StaffSettingsPageProvider>
      </FeatureGate>
    </Suspense>
  );
}

function StaffSettingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { context } = useActivePharmacy();
  const tabFromUrl = parseStaffSettingsTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<StaffSettingsTabValue>(tabFromUrl);

  useEffect(() => {
    if (isPharmacyOwnerRole(context.role)) {
      router.replace(PHARMACY_ROUTES.settings);
    }
  }, [context.role, router]);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (next: StaffSettingsTabValue) => {
    setActiveTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${PHARMACY_ROUTES.staffSettings}?${params.toString()}`, {
      scroll: false,
    });
  };

  if (isPharmacyOwnerRole(context.role)) {
    return <DashboardPageLoading label="Redirecting…" />;
  }

  return (
    <StaffSettingsShell activeTab={activeTab} onTabChange={handleTabChange}>
      <StaffSettingsActivePanel tab={activeTab} />
    </StaffSettingsShell>
  );
}
