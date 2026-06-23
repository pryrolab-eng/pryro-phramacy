"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

function integrationTone(status: string): "neutral" | "active" | "inactive" {
  if (status === "healthy") return "active";
  if (status === "not_configured") return "inactive";
  return "neutral";
}

function insuranceLabel(status: string): string {
  if (status === "healthy") return "Healthy";
  if (status === "not_configured") return "Not configured";
  return "Review";
}

export function AdminSettingsIntegrationsPanel() {
  const {
    settings,
    setSettings,
    apiKeys,
    setIsAddApiKeyOpen,
    setSelectedApiKey,
    setIsEditApiKeyOpen,
    integrationStatus,
    deleteApiKeyMutation,
  } = useAdminSettings();
  const [deleteTarget, setDeleteTarget] = useState<typeof apiKeys[0] | null>(null);

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
                      key: "",
                      permissions: api.permissions ?? [],
                    });
                    setIsEditApiKeyOpen(true);
                  }}
                >
                  Edit
                </DashboardButton>
                <DashboardButton
                  size="sm"
                  variant="ghost"
                  tone="destructive"
                  onClick={() => setDeleteTarget(api)}
                  disabled={deleteApiKeyMutation.isPending}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
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
          description="Polar and related checkout integrations"
        >
          <AdminStatusChip
            tone={integrationTone(integrationStatus.paymentGateway.status)}
          >
            {integrationStatus.paymentGateway.configured ? "Healthy" : "Not configured"}
          </AdminStatusChip>
        </SettingsRow>
        <SettingsRow
          title="Insurance APIs"
          description="Provider pricing and claim lookups"
        >
          <AdminStatusChip
            tone={integrationTone(integrationStatus.insurance.status)}
            title={`${integrationStatus.insurance.activeProviders} active providers, ${integrationStatus.insurance.activeTemplates} active templates`}
          >
            {insuranceLabel(integrationStatus.insurance.status)}
          </AdminStatusChip>
        </SettingsRow>
      </SettingsSection>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete API key</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The key will be permanently revoked.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="font-mono">{deleteTarget?.key_prefix}••••••••••••••••••••••••••••••••</strong>?
            </p>
          </div>
          <DialogFooter>
            <DashboardButton
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteApiKeyMutation.isPending}
            >
              Cancel
            </DashboardButton>
            <DashboardButton
              tone="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteApiKeyMutation.mutateAsync(deleteTarget.id);
                  setDeleteTarget(null);
                } catch {}
              }}
              disabled={deleteApiKeyMutation.isPending}
            >
              Delete permanently
            </DashboardButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
