"use client";

import { Switch } from "@/components/ui/switch";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";

export function SettingsIntegrationsPanel() {
  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Integrations"
        description="Connected third-party services for your pharmacy"
      />

      <SettingsSection title="Connected services">
        <SettingsRow
          title="Supplier integration"
          description="Automatic inventory sync with suppliers"
        >
          <Switch defaultChecked />
        </SettingsRow>
        <SettingsRow
          title="Insurance claims"
          description="Real-time claim processing"
        >
          <Switch />
        </SettingsRow>
        <SettingsRow
          title="SMS notifications"
          description="Customer alerts via SMS"
        >
          <Switch defaultChecked />
        </SettingsRow>
      </SettingsSection>

      <p className="text-sm text-neutral-500">
        Platform integration API keys are issued by Pryrox administrators (Admin →
        Settings → Integrations) for external systems calling Pryrox APIs — not
        per-pharmacy credentials.
      </p>
    </div>
  );
}
