"use client";

import type { ComponentType } from "react";
import type { AdminSettingsTabValue } from "@/lib/admin-settings-tabs";
import { AdminSettingsAnalyticsPanel } from "@/components/admin/settings/panels/admin-settings-analytics-panel";
import { AdminSettingsCompliancePanel } from "@/components/admin/settings/panels/admin-settings-compliance-panel";
import { AdminSettingsGeneralPanel } from "@/components/admin/settings/panels/admin-settings-general-panel";
import { AdminSettingsIntegrationsPanel } from "@/components/admin/settings/panels/admin-settings-integrations-panel";
import { AdminSettingsNotificationsPanel } from "@/components/admin/settings/panels/admin-settings-notifications-panel";
import { AdminSettingsOperationsPanel } from "@/components/admin/settings/panels/admin-settings-operations-panel";
import { AdminSettingsProfilePanel } from "@/components/admin/settings/panels/admin-settings-profile-panel";
import { AdminSettingsSecurityPanel } from "@/components/admin/settings/panels/admin-settings-security-panel";
import { AdminSettingsTenantsPanel } from "@/components/admin/settings/panels/admin-settings-tenants-panel";

const PANELS: Record<AdminSettingsTabValue, ComponentType> = {
  profile: AdminSettingsProfilePanel,
  general: AdminSettingsGeneralPanel,
  notifications: AdminSettingsNotificationsPanel,
  tenants: AdminSettingsTenantsPanel,
  integrations: AdminSettingsIntegrationsPanel,
  security: AdminSettingsSecurityPanel,
  compliance: AdminSettingsCompliancePanel,
  operations: AdminSettingsOperationsPanel,
  analytics: AdminSettingsAnalyticsPanel,
};

export function AdminSettingsActivePanel({ tab }: { tab: AdminSettingsTabValue }) {
  const Panel = PANELS[tab];
  return <Panel />;
}
