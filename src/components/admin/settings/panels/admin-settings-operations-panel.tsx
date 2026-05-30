"use client";

import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AdminStatusChip } from "@/components/admin/dashboard/admin-dashboard-ui";
import { DashboardButton, DashboardProgressTrack } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsOperationsPanel() {
  const { settings, setSettings, stockLocations, setIsAddLocationOpen } =
    useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Operations"
        description="Maintenance, backups, and default stock locations"
      />

      <SettingsSection title="System">
        <SettingsRow
          title="Maintenance mode"
          description="Block non-admin access while you perform upgrades"
        >
          <Switch
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, maintenanceMode: checked })
            }
          />
        </SettingsRow>
        <SettingsRow
          title="Automatic updates"
          description="Apply security patches when available"
        >
          <Switch
            checked={settings.autoUpdates}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, autoUpdates: checked })
            }
          />
        </SettingsRow>
        <SettingsRow title="System load" description="Approximate platform utilization">
          <div className="w-full min-w-[140px] max-w-[200px] space-y-1">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Capacity</span>
              <span>45%</span>
            </div>
            <DashboardProgressTrack value={45} />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Backups">
        <SettingsRow
          title="Automatic backups"
          description="Scheduled database backups"
        >
          <Switch
            checked={settings.backupEnabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, backupEnabled: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Stock location templates"
        description="Defaults for new pharmacies — stores manage their own in pharmacy settings"
      >
        {stockLocations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">
            No template locations yet. Add a default warehouse or shelf location.
          </p>
        ) : (
          stockLocations.map((location) => (
            <SettingsRow
              key={location.id}
              title={location.name}
              description={location.description ?? undefined}
            >
              <AdminStatusChip tone="active">Active</AdminStatusChip>
            </SettingsRow>
          ))
        )}
        <div className="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
          <DashboardButton onClick={() => setIsAddLocationOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            Add location
          </DashboardButton>
        </div>
      </SettingsSection>
    </div>
  );
}
