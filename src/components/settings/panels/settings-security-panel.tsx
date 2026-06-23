"use client";

import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useSettingsPage } from "@/components/settings/settings-page-provider";
import { ChangePasswordSettingsRow } from "@/components/auth/change-password-settings-row";

export function SettingsSecurityPanel() {
  const {
    is2FAEnabled,
    platformAllowsTwoFactor,
    setIs2FASetupOpen,
    setTwoFaMutation,
    ipWhitelistEnabled,
    setIsIpWhitelistOpen,
    updateSecurityMutation,
    ipWhitelist,
    currentIp,
  } = useSettingsPage();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Security"
        description="Your account and pharmacy data protection"
      />

      <SettingsSection title="Your account">
        <ChangePasswordSettingsRow />
        <SettingsRow
          title="Two-factor authentication"
          description={
            platformAllowsTwoFactor
              ? "Optional for your account — enable or disable anytime"
              : "Disabled platform-wide by the administrator"
          }
        >
          <Switch
            checked={is2FAEnabled}
            disabled={!platformAllowsTwoFactor}
            onCheckedChange={async (checked) => {
              if (!platformAllowsTwoFactor) return;
              if (checked) {
                setIs2FASetupOpen(true);
              } else if (
                confirm(
                  "Disable 2FA? This will make your account less secure.",
                )
              ) {
                try {
                  await setTwoFaMutation.mutateAsync(false);
                  toast.success("2FA disabled");
                } catch {
                  toast.error("Failed to disable 2FA");
                }
              }
            }}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Network access">
        <SettingsRow
          title="IP whitelist"
          description={
            ipWhitelistEnabled
              ? "Only listed addresses can use this pharmacy workspace"
              : "Restrict dashboard and API access to approved office or VPN IPs"
          }
        >
          <div className="flex items-center gap-2">
            <Badge variant={ipWhitelistEnabled ? "default" : "secondary"}>
              {ipWhitelist.length} IP{ipWhitelist.length === 1 ? "" : "s"}
            </Badge>
            <DashboardButton size="sm" onClick={() => setIsIpWhitelistOpen(true)}>
              Manage
            </DashboardButton>
            <Switch
              checked={ipWhitelistEnabled}
              disabled={updateSecurityMutation.isPending}
              onCheckedChange={async (checked) => {
                try {
                  await updateSecurityMutation.mutateAsync({
                    ip_whitelist_enabled: checked,
                  });
                  toast.success(
                    checked
                      ? "IP whitelist enabled — your current IP was added"
                      : "IP whitelist disabled",
                  );
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to update IP whitelist",
                  );
                }
              }}
            />
          </div>
        </SettingsRow>
        {currentIp ? (
          <p className="px-1 text-xs text-muted-foreground">
            Your current IP:{" "}
            <span className="font-mono text-foreground">{currentIp}</span>
          </p>
        ) : null}
      </SettingsSection>

      <SettingsSection title="Data protection">
        <SettingsRow
          title="Data encryption"
          description="AES-256 encryption at rest for pharmacy data"
        >
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Active
          </Badge>
        </SettingsRow>
        <SettingsRow
          title="Session timeout"
          description="Session lifetime is managed by the platform session policy"
        >
          <Badge variant="secondary">Platform managed</Badge>
        </SettingsRow>
      </SettingsSection>

      <div className="flex items-start gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-400">
        <Shield className="mt-0.5 size-4 shrink-0" />
      </div>
    </div>
  );
}
