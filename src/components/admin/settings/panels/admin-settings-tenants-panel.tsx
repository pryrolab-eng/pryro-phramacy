"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsTenantsPanel() {
  const { settings, setSettings } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Tenants"
        description="Multi-tenant limits and branding options"
      />

      <SettingsSection title="Limits">
        <SettingsRow
          title="Max users per pharmacy"
          description="Default cap for staff accounts on a single store"
        >
          <Input
            type="number"
            className="w-[120px]"
            value={settings.maxUsersPerPharmacy}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxUsersPerPharmacy: Number(e.target.value) || 0,
              })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Features">
        <SettingsRow
          title="Multi-branch"
          description="Allow multiple locations per pharmacy"
        >
          <Switch
            checked={settings.enableMultiBranch}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableMultiBranch: checked })
            }
          />
        </SettingsRow>
        <SettingsRow
          title="White-label"
          description="Custom branding per tenant (pharmacy settings)"
        >
          <Switch
            checked={settings.enableWhiteLabel}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableWhiteLabel: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
