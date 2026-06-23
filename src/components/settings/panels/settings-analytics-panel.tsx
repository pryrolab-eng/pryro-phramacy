"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";

export function SettingsAnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [recipients, setRecipients] = useState("");

  useEffect(() => {
    fetch("/api/settings/report-schedules")
      .then((res) => res.json())
      .then((data) => {
        const sales = data.schedules?.find((s: any) => s.reportType === "sales");
        if (sales) {
          setScheduleId(sales.id);
          setIsActive(sales.isActive);
          setFrequency(sales.frequency !== "off" ? sales.frequency : "weekly");
          setRecipients(Array.isArray(sales.recipients) ? sales.recipients.join(", ") : "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load report schedules:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings/report-schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "sales",
          frequency: isActive ? frequency : "off",
          recipients: recipients
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email.includes("@")),
          isActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Analytics settings saved");
        if (data.schedule) {
          setScheduleId(data.schedule.id);
          setIsActive(data.schedule.isActive);
          setFrequency(data.schedule.frequency !== "off" ? data.schedule.frequency : frequency);
          setRecipients(
            Array.isArray(data.schedule.recipients)
              ? data.schedule.recipients.join(", ")
              : "",
          );
        }
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-5 text-sm text-neutral-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Analytics"
        description="Reporting preferences and operational insights"
      />

      <SettingsSection title="Reports">
        <SettingsRow
          title="Daily sales reports"
          description="Send automated sales summaries to selected recipients"
        >
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Scheduled" : "Not scheduled"}
            </Badge>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </SettingsRow>
        <SettingsRow
          title="Inventory analytics"
          description="Available from inventory reports"
        >
          <Badge variant="secondary">Always on</Badge>
        </SettingsRow>
        <SettingsRow title="Report frequency" description="How often reports are delivered">
          <Select
            value={frequency}
            onValueChange={setFrequency}
            disabled={!isActive}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        {isActive && (
          <div className="space-y-2 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <Label htmlFor="recipients">Recipient Email Addresses (comma separated)</Label>
            <Input
              id="recipients"
              placeholder="e.g. manager@pharmacy.com, owner@pharmacy.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="max-w-md"
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Performance">
        <p className="px-5 py-6 text-sm text-neutral-500">
          Detailed system metrics are available to administrators from the admin
          dashboard. Pharmacy-level performance views are coming soon.
        </p>
      </SettingsSection>

      <div className="px-5">
        <DashboardButton tone="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Analytics Settings"}
        </DashboardButton>
      </div>
    </div>
  );
}
