"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import { AdminStatusChip } from "@/components/admin/dashboard/admin-dashboard-ui";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";
import { formatIntegrationKeyPermissions } from "@/components/admin/settings/platform-api-key-permissions";

export function AdminSettingsIntegrationsPanel() {
  const {
    settings,
    setSettings,
    apiKeys,
    setIsAddApiKeyOpen,
    setSelectedApiKey,
    setIsEditApiKeyOpen,
  } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Integrations"
        description="Platform integration API keys for external developers, plus rate limits"
        action={
          <DashboardButton tone="primary" onClick={() => setIsAddApiKeyOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            API key
          </DashboardButton>
        }
      />

      <SettingsSection title="API keys">
        {apiKeys.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">
            No platform API keys yet. Issue keys here for external developers and
            partners integrating with Pryrox (not per-pharmacy tenant keys).
          </p>
        ) : (
          apiKeys.map((api) => (
            <SettingsRow
              key={api.id}
              title={api.name}
              description={`${api.key_prefix}… · ${formatIntegrationKeyPermissions(api.permissions)}`}
            >
              <div className="flex items-center gap-2">
                <Badge variant={api.is_active ? "default" : "secondary"}>
                  {api.is_active ? "Active" : "Inactive"}
                </Badge>
                <DashboardButton
                  size="sm"
                  onClick={() => {
                    setSelectedApiKey({
                      ...api,
                      status: api.is_active ? "Active" : "Inactive",
                      key: api.key_hash ?? "",
                      permissions: api.permissions ?? [],
                    });
                    setIsEditApiKeyOpen(true);
                  }}
                >
                  Edit
                </DashboardButton>
              </div>
            </SettingsRow>
          ))
        )}
      </SettingsSection>

      <SettingsSection title="API">
        <SettingsRow
          title="Rate limit"
          description="Max requests per hour per platform API key (and per IP without a key)"
        >
          <Input
            type="number"
            className="w-[140px]"
            value={settings.apiRateLimit}
            onChange={(e) =>
              setSettings({
                ...settings,
                apiRateLimit: Number(e.target.value) || 0,
              })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Connected services"
        description="Status overview — configure credentials in deployment env"
      >
        <SettingsRow
          title="Payment gateway"
          description="KPay, Polar, and related checkout integrations"
        >
          <AdminStatusChip tone="active">Healthy</AdminStatusChip>
        </SettingsRow>
        <SettingsRow
          title="Insurance APIs"
          description="Provider pricing and claim lookups"
        >
          <AdminStatusChip tone="neutral">Review</AdminStatusChip>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
