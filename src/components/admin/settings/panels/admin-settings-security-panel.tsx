"use client";

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

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
          description="Restrict platform admin API and console access to approved addresses"
        >
          <DashboardButton size="sm" onClick={() => setIsIpWhitelistOpen(true)}>
            Manage
          </DashboardButton>
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
        <SettingsRow
          title="SSO integration"
          description="Single sign-on for enterprise tenants"
        >
          <Switch
            checked={settings.ssoEnabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, ssoEnabled: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Data protection">
        <SettingsRow
          title="Data encryption"
          description="AES-256 encryption for sensitive platform data"
        >
          <Switch
            checked={settings.encryptionEnabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, encryptionEnabled: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
