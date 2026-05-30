"use client";

import { Switch } from "@/components/ui/switch";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsNotificationsPanel() {
  const { settings, setSettings } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Notifications"
        description="Platform-wide notification delivery"
      />

      <SettingsSection title="Delivery">
        <SettingsRow
          title="System notifications"
          description="Send email and in-app alerts for platform events"
        >
          <Switch
            checked={settings.enableNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableNotifications: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
