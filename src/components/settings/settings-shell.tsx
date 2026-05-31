"use client";

import type { ReactNode } from "react";
import {
  DashboardPageShell,
  DashboardPageHeader,
} from "@/components/dashboard";
import { SettingsNav } from "@/components/settings/settings-nav";
import { getSettingsTabLabel } from "@/components/settings/settings-nav-config";
import type { SettingsTabValue } from "@/lib/settings-tabs";

type Props = {
  activeTab: SettingsTabValue;
  onTabChange: (tab: SettingsTabValue) => void;
  children: ReactNode;
};

export function SettingsShell({ activeTab, onTabChange, children }: Props) {
  const sectionLabel = getSettingsTabLabel(activeTab);

  return (
    <DashboardPageShell className="max-w-5xl min-w-0">
      <DashboardPageHeader
        title="Settings"
        description={`${sectionLabel} — pharmacy profile, security, and workspace`}
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <SettingsNav activeTab={activeTab} onTabChange={onTabChange} />
        <div className="min-w-0 flex-1 pb-8">{children}</div>
      </div>
    </DashboardPageShell>
  );
}
