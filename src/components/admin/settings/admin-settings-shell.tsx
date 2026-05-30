"use client";

import type { ReactNode } from "react";
import { DashboardPageShell } from "@/components/dashboard";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSettingsNav } from "@/components/admin/settings/admin-settings-nav";
import { AdminSettingsFeedback } from "@/components/admin/settings/admin-settings-feedback";
import { getAdminSettingsTabLabel } from "@/components/admin/settings/admin-settings-nav-config";
import type { AdminSettingsTabValue } from "@/lib/admin-settings-tabs";

type Props = {
  activeTab: AdminSettingsTabValue;
  onTabChange: (tab: AdminSettingsTabValue) => void;
  children: ReactNode;
};

/** Same shell layout as pharmacy {@link SettingsShell}. */
export function AdminSettingsShell({ activeTab, onTabChange, children }: Props) {
  const sectionLabel = getAdminSettingsTabLabel(activeTab);

  return (
    <DashboardPageShell>
      <AdminPageHeader
        pinTitle="Admin settings"
        title="Admin settings"
        description={`${sectionLabel} — platform configuration and operations`}
      />

      <AdminSettingsFeedback />

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <AdminSettingsNav activeTab={activeTab} onTabChange={onTabChange} />
        <div className="min-w-0 flex-1 pb-8">{children}</div>
      </div>
    </DashboardPageShell>
  );
}
