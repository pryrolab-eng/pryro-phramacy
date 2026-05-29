"use client";

import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useSettingsPage } from "@/components/settings/settings-page-provider";

export function SettingsIntegrationsPanel() {
  const {
    apiKeys,
    setIsAddApiKeyOpen,
    setSelectedApiKey,
    setIsEditApiKeyOpen,
  } = useSettingsPage();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Integrations"
        description="API keys and connected third-party services"
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
            No API keys yet. Add one for payment gateways or custom integrations.
          </p>
        ) : (
          apiKeys.map((api) => (
            <SettingsRow
              key={api.id}
              title={api.name}
              description={`${api.key_prefix}…`}
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
                      key: api.key_hash,
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
    </div>
  );
}
