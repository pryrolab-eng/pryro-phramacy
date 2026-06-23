"use client";

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";
import { ChangePasswordSettingsRow } from "@/components/auth/change-password-settings-row";

export function AdminSettingsSecurityPanel() {
  const {
    settings,
    setSettings,
    is2FAEnabled,
    setIs2FASetupOpen,
    setTwoFaMutation,
    setIsIpWhitelistOpen,
  } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Security"
        description="Platform admin account protection and tenant authentication policy"
      />

      <SettingsSection title="Your account">
        <ChangePasswordSettingsRow description="Update your platform admin sign-in password." />
        <SettingsRow
          title="Two-factor authentication"
          description="Protect your platform admin sign-in with an authenticator app"
        >
          <Switch
            checked={is2FAEnabled}
            onCheckedChange={async (checked) => {
              if (checked) {
                setIs2FASetupOpen(true);
              } else if (
                confirm(
                  "Disable 2FA? This will make your admin account less secure.",
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
          title="IP whitelist"
          description={
            settings.ipWhitelistEnabled
              ? "Platform admin access is limited to approved addresses"
              : "Restrict platform admin API and console access to approved addresses"
          }
        >
          <div className="flex items-center gap-2">
            <DashboardButton size="sm" onClick={() => setIsIpWhitelistOpen(true)}>
              Manage
            </DashboardButton>
            <Switch
              checked={settings.ipWhitelistEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, ipWhitelistEnabled: checked })
              }
            />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Tenant policy">
        <SettingsRow
          title="Allow user two-factor (2FA)"
          description="When on, pharmacy owners and staff can enable 2FA on their account under Pharmacy → Settings → Security."
        >
          <Switch
            checked={settings.allowUserTwoFactor}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, allowUserTwoFactor: checked })
            }
          />
        </SettingsRow>
        <SettingsRow
          title="New registrations"
          description="Allow new pharmacy sign-ups on the platform"
        >
          <Switch
            checked={settings.enableRegistrations}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableRegistrations: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Data protection">
        <SettingsRow
          title="Data encryption"
          description="Managed by database, hosting, and storage configuration"
        >
          <Badge variant="secondary">Platform managed</Badge>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
