"use client";

import type { StaffSettingsTabValue } from "@/lib/staff-settings-tabs";
import { StaffSettingsAccountPanel } from "@/components/staff/panels/staff-settings-account-panel";
import { StaffSettingsWorkplacePanel } from "@/components/staff/panels/staff-settings-workplace-panel";
import { StaffSettingsSecurityPanel } from "@/components/staff/panels/staff-settings-security-panel";

const PANELS: Record<StaffSettingsTabValue, React.ComponentType> = {
  workplace: StaffSettingsWorkplacePanel,
  account: StaffSettingsAccountPanel,
  security: StaffSettingsSecurityPanel,
};

export function StaffSettingsActivePanel({ tab }: { tab: StaffSettingsTabValue }) {
  const Panel = PANELS[tab];
  return <Panel />;
}
