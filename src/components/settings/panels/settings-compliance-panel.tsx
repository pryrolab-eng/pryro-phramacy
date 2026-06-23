"use client";

import { Badge } from "@/components/ui/badge";
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

export function SettingsCompliancePanel() {
  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Compliance"
        description="Regulatory, audit, and data retention settings"
      />

      <SettingsSection title="Regulatory">
        <SettingsRow
          title="GDPR compliance"
          description="Platform policy managed by administrators"
        >
          <Badge variant="secondary">Platform managed</Badge>
        </SettingsRow>
        <SettingsRow
          title="Audit logging"
          description="Runtime enforcement follows the platform audit setting"
        >
          <Badge variant="secondary">Platform managed</Badge>
        </SettingsRow>
        <SettingsRow
          title="Data retention period"
          description="How long records are kept"
        >
          <Select defaultValue="7years" disabled>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1year">1 year</SelectItem>
              <SelectItem value="3years">3 years</SelectItem>
              <SelectItem value="7years">7 years</SelectItem>
              <SelectItem value="indefinite">Indefinite</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Backup & recovery">
        <SettingsRow
          title="Automated backups"
          description="Database backups are run from Admin settings"
        >
          <Badge variant="secondary">Admin only</Badge>
        </SettingsRow>
        <SettingsRow title="Backup frequency">
          <Select defaultValue="daily" disabled>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
