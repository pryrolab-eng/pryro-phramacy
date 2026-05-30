"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsCompliancePanel() {
  const { settings, setSettings } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Compliance"
        description="Audit trails and data retention"
      />

      <SettingsSection title="Retention & audit">
        <SettingsRow
          title="Data retention"
          description="Days to retain transactional and audit records"
        >
          <Input
            type="number"
            className="w-[140px]"
            value={settings.dataRetentionDays}
            onChange={(e) =>
              setSettings({
                ...settings,
                dataRetentionDays: Number(e.target.value) || 0,
              })
            }
          />
        </SettingsRow>
        <SettingsRow
          title="Audit logging"
          description="Track sign-ins and sensitive admin changes"
        >
          <Switch
            checked={settings.enableAuditLogs}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableAuditLogs: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Reports">
        <div className="px-5 py-4">
          <DashboardButton tone="outline" className="w-full sm:w-auto" asChild>
            <Link href="/admin/reports">
              <FileText className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Open platform reports
            </Link>
          </DashboardButton>
        </div>
      </SettingsSection>
    </div>
  );
}
