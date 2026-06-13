"use client";

import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DashboardSectionCard } from "@/components/dashboard";
import { SettingsRow } from "@/components/settings/settings-primitives";
import { useStaffSettingsPage } from "@/components/staff/staff-settings-page-provider";
import { ChangePasswordSettingsRow } from "@/components/auth/change-password-settings-row";

export function StaffSettingsSecurityPanel() {
  const {
    is2FAEnabled,
    platformAllowsTwoFactor,
    setIs2FASetupOpen,
    setTwoFaMutation,
  } = useStaffSettingsPage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Security</h2>
        <p className="text-sm text-muted-foreground">
          Protect your personal login. Pharmacy-wide security is managed by your
          owner in pharmacy settings.
        </p>
      </div>

      <DashboardSectionCard title="Your account" contentClassName="p-0">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <ChangePasswordSettingsRow />
          <SettingsRow
            title="Two-factor authentication"
            description={
              platformAllowsTwoFactor
                ? "Optional — recommended for shared devices"
                : "Disabled by your platform administrator"
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
        </div>
      </DashboardSectionCard>

      <div className="flex items-start gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-400">
        <Shield className="mt-0.5 size-4 shrink-0" />
        <p>
          Password resets and role changes are handled by your pharmacy owner.
          Use Forgot password on the sign-in page if you are locked out.
        </p>
      </div>
    </div>
  );
}
