"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useSettingsPage } from "@/components/settings/settings-page-provider";

export function SettingsOperationsPanel() {
  const { stockLocations, setIsAddLocationOpen } = useSettingsPage();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Operations"
        description="Stock locations and system behavior"
      />

      <SettingsSection
        title="Stock locations"
        description="Warehouses and storage areas for inventory"
      >
        {stockLocations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">
            No locations yet. Add your first warehouse or storage area.
          </p>
        ) : (
          stockLocations.map((location) => (
            <SettingsRow
              key={location.id}
              title={location.name}
              description={location.description ?? undefined}
            >
              <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
            </SettingsRow>
          ))
        )}
        <div className="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
          <DashboardButton onClick={() => setIsAddLocationOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add location
          </DashboardButton>
        </div>
      </SettingsSection>

      <SettingsSection title="System">
        <SettingsRow
          title="Maintenance mode"
          description="Controlled by platform administrators"
        >
          <Badge variant="secondary">Platform only</Badge>
        </SettingsRow>
        <SettingsRow
          title="Automatic updates"
          description="Deployment updates are managed outside pharmacy settings"
        >
          <Badge variant="secondary">Managed</Badge>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
