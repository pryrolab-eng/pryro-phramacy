"use client";

import { Input } from "@/components/ui/input";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsGeneralPanel() {
  const { settings, setSettings } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="General"
        description="Platform identity and global defaults"
      />

      <SettingsSection title="Platform identity">
        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Platform name
            </label>
            <Input
              value={settings.platformName}
              onChange={(e) =>
                setSettings({ ...settings, platformName: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Platform logo URL
            </label>
            <Input
              placeholder="https://example.com/logo.png"
              value={settings.platformLogoUrl}
              onChange={(e) =>
                setSettings({ ...settings, platformLogoUrl: e.target.value })
              }
            />
            {settings.platformLogoUrl ? (
              <img
                src={settings.platformLogoUrl}
                alt="Logo preview"
                className="mt-1 h-8 w-auto object-contain"
              />
            ) : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Admin contact email
            </label>
            <Input
              type="email"
              value={settings.adminEmail}
              onChange={(e) =>
                setSettings({ ...settings, adminEmail: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Internal platform contact (not shown to pharmacy users).
            </p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Support email
            </label>
            <Input
              type="email"
              placeholder="support@yourcompany.com"
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Used for “Contact support” on suspended subscriptions, billing
              blocks, and staff dashboards.
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Capacity">
        <SettingsRow
          title="Maximum pharmacies"
          description="Upper bound for registered stores on the platform"
        >
          <Input
            type="number"
            className="w-[120px]"
            value={settings.maxPharmacies}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxPharmacies: Number(e.target.value) || 0,
              })
            }
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
