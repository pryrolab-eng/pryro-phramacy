"use client";

import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
  SettingsCheckboxGroup,
} from "@/components/settings/settings-primitives";
import { useSettingsPage } from "@/components/settings/settings-page-provider";

export function SettingsNotificationsPanel() {
  const { notifyPrefs, saveNotifyPrefs } = useSettingsPage();

  const patch = (key: keyof typeof notifyPrefs, value: boolean) => {
    void saveNotifyPrefs({ ...notifyPrefs, [key]: value });
  };

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Notifications"
        description="Choose what you are notified about and how"
      />

      <SettingsSection title="My notifications">
        <SettingsCheckboxGroup
          title="Notify me when…"
          linkLabel="About notifications?"
          onLinkClick={() =>
            toast.message("Notification delivery uses your pharmacy email settings.")
          }
          options={[
            {
              id: "daily",
              label: "Daily productivity update",
              checked: notifyPrefs.dailyUpdate,
              onChange: (c) => patch("dailyUpdate", c),
            },
            {
              id: "low",
              label: "Low stock alert",
              checked: notifyPrefs.lowStock,
              onChange: (c) => patch("lowStock", c),
            },
            {
              id: "expiry",
              label: "Medication nearing expiry",
              checked: notifyPrefs.expiry,
              onChange: (c) => patch("expiry", c),
            },
          ]}
        />
        <SettingsRow
          title="Mobile push notifications"
          description="Alerts on your phone when the app supports push"
        >
          <Switch
            checked={notifyPrefs.push}
            onCheckedChange={(c) => patch("push", c)}
          />
        </SettingsRow>
        <SettingsRow
          title="Desktop notification"
          description="Browser notifications while Pryrox is open"
        >
          <Switch
            checked={notifyPrefs.desktop}
            onCheckedChange={(c) => patch("desktop", c)}
          />
        </SettingsRow>
        <SettingsRow
          title="Email notification"
          description="Summaries and alerts to your pharmacy email"
        >
          <Switch
            checked={notifyPrefs.email}
            onCheckedChange={(c) => patch("email", c)}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Reports & system">
        <SettingsRow
          title="Sales reports"
          description="Daily and weekly sales summaries"
        >
          <Switch
            checked={notifyPrefs.salesReports}
            onCheckedChange={(c) => patch("salesReports", c)}
          />
        </SettingsRow>
        <SettingsRow
          title="System updates"
          description="New features and maintenance windows"
        >
          <Switch
            checked={notifyPrefs.systemUpdates}
            onCheckedChange={(c) => patch("systemUpdates", c)}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
