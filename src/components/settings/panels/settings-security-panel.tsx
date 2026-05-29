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

export function SettingsSecurityPanel() {
  const {
    is2FAEnabled,
    setIs2FASetupOpen,
    setTwoFaMutation,
    ipWhitelistEnabled,
    toggleIpWhitelist,
    setIsIpWhitelistOpen,
  } = useSettingsPage();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Security"
        description="Authentication, access control, and data protection"
      />

      <SettingsSection title="Authentication">
        <SettingsRow
          title="Two-factor authentication"
          description="Require a code from your authenticator app at sign-in"
        >
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={async (checked) => {
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
        <SettingsRow
          title="IP whitelisting"
          description="Only allow sign-in from approved IP addresses"
        >
          <Switch
            checked={ipWhitelistEnabled}
            onCheckedChange={(c) => void toggleIpWhitelist(c)}
          />
        </SettingsRow>
        <SettingsRow
          title="Manage IP whitelist"
          description="Add or remove allowed addresses"
        >
          <DashboardButton size="sm" onClick={() => setIsIpWhitelistOpen(true)}>
            Manage
          </DashboardButton>
        </SettingsRow>
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
          description="Auto sign-out after a period of inactivity"
        >
          <Switch defaultChecked />
        </SettingsRow>
        <SettingsRow
          title="SSO integration"
          description="Single sign-on with SAML or OAuth (coming soon)"
        >
          <Switch disabled />
        </SettingsRow>
      </SettingsSection>

      <div className="flex items-start gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-400">
        <Shield className="mt-0.5 size-4 shrink-0" />
        <p>
          For password changes, use your account profile or contact your pharmacy
          administrator.
        </p>
      </div>
    </div>
  );
}
