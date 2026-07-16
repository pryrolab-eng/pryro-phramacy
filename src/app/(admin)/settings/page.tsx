"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { replaceUrlShallow } from "@/lib/navigation/shallow-url";

import { AdminSettingsActivePanel } from "@/components/admin/settings/admin-settings-active-panel";
import { AdminSettingsDialogs } from "@/components/admin/settings/admin-settings-dialogs";
import {
  AdminSettingsProvider,
  useAdminSettings,
} from "@/components/admin/settings/admin-settings-provider";
import { AdminSettingsSaveBar } from "@/components/admin/settings/admin-settings-save-bar";
import { AdminSettingsShell } from "@/components/admin/settings/admin-settings-shell";
import { DashboardPageLoading } from "@/components/dashboard";
import {
  parseAdminSettingsTab,
  type AdminSettingsTabValue,
} from "@/lib/admin-settings-tabs";

function AdminSettingsPageInner() {
  const searchParams = useSearchParams();
  const { pageLoading } = useAdminSettings();

  const tabFromUrl = parseAdminSettingsTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<AdminSettingsTabValue>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const onTabChange = useCallback(
    (tab: AdminSettingsTabValue) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      replaceUrlShallow(`/admin/settings?${params.toString()}`);
    },
    [searchParams],
  );

  if (pageLoading) {
    return <DashboardPageLoading label="Loading platform settings…" />;
  }

  return (
    <AdminSettingsShell activeTab={activeTab} onTabChange={onTabChange}>
      <AdminSettingsActivePanel tab={activeTab} />
      <AdminSettingsSaveBar />
      <AdminSettingsDialogs />
    </AdminSettingsShell>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={<DashboardPageLoading label="Loading platform settings…" />}
    >
      <AdminSettingsProvider>
        <AdminSettingsPageInner />
      </AdminSettingsProvider>
    </Suspense>
  );
}
