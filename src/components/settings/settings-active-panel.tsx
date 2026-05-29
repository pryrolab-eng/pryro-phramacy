"use client";

import type { ComponentType } from "react";
import type { SettingsTabValue } from "@/lib/settings-tabs";
import { getSettingsTabFeatureKey } from "@/components/settings/settings-nav-config";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { SettingsGeneralPanel } from "@/components/settings/panels/settings-general-panel";
import { SettingsNotificationsPanel } from "@/components/settings/panels/settings-notifications-panel";
import { SettingsBrandingPanel } from "@/components/settings/panels/settings-branding-panel";
import { SettingsSecurityPanel } from "@/components/settings/panels/settings-security-panel";
import { SettingsIntegrationsPanel } from "@/components/settings/panels/settings-integrations-panel";
import { SettingsOperationsPanel } from "@/components/settings/panels/settings-operations-panel";
import { SettingsCompliancePanel } from "@/components/settings/panels/settings-compliance-panel";
import { SettingsAnalyticsPanel } from "@/components/settings/panels/settings-analytics-panel";

const PANELS: Record<SettingsTabValue, ComponentType> = {
  general: SettingsGeneralPanel,
  notifications: SettingsNotificationsPanel,
  branding: SettingsBrandingPanel,
  security: SettingsSecurityPanel,
  integrations: SettingsIntegrationsPanel,
  operations: SettingsOperationsPanel,
  compliance: SettingsCompliancePanel,
  analytics: SettingsAnalyticsPanel,
};

export function SettingsActivePanel({ tab }: { tab: SettingsTabValue }) {
  const featureKey = getSettingsTabFeatureKey(tab);
  const { can, isHydrating, isEntitlementsReady } = usePharmacyEntitlements();

  if (featureKey && isEntitlementsReady && !can(featureKey)) {
    return <UpgradePrompt featureKey={featureKey} />;
  }

  if (featureKey && isHydrating) {
    return null;
  }

  const Panel = PANELS[tab];
  return <Panel />;
}
