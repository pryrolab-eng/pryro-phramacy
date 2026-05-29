"use client";

import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";

export function SettingsAnalyticsPanel() {
  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Analytics"
        description="Reporting preferences and operational insights"
      />

      <SettingsSection title="Reports">
        <SettingsRow
          title="Daily sales reports"
          description="Automated end-of-day summaries"
        >
          <Switch defaultChecked />
        </SettingsRow>
        <SettingsRow
          title="Inventory analytics"
          description="Stock movement and turnover insights"
        >
          <Switch defaultChecked />
        </SettingsRow>
        <SettingsRow title="Report frequency">
          <Select defaultValue="weekly">
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Performance">
        <p className="px-5 py-6 text-sm text-neutral-500">
          Detailed system metrics are available to administrators from the admin
          dashboard. Pharmacy-level performance views are coming soon.
        </p>
      </SettingsSection>
    </div>
  );
}
