"use client";

import { Input } from "@/components/ui/input";
import {
  SettingsPanelTitle,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsProfilePanel() {
  const { profile, setProfile } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Profile"
        description="Your platform admin account details"
      />

      <SettingsSection title="Personal information">
        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Display name
            </label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your display name"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Full name
            </label>
            <Input
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              Email
            </label>
            <Input
              type="email"
              value={profile.email}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed from here.
            </p>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
