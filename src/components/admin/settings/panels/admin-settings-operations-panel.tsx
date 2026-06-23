"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Calendar, Bell, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminStatusChip } from "@/components/admin/dashboard/admin-dashboard-ui";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

type QueueStats = {
  configured: boolean;
  stats: { waiting: number; active: number; completed: number; failed: number; delayed: number } | null;
  recentBatches: Array<{
    batchId: string;
    sent: number;
    failed: number;
    total: number;
    createdAt: string;
  }>;
};

export function AdminSettingsOperationsPanel() {
  const { settings, setSettings, stockLocations, setIsAddLocationOpen, handleSave } = useAdminSettings();
  const maintenance = settings.scheduledMaintenance ?? {
    enabled: false,
    scheduledAt: null,
    message: "Scheduled maintenance — we'll be back shortly.",
    notified: false,
  };
  const [localScheduledAt, setLocalScheduledAt] = useState(maintenance.scheduledAt ?? "");
  const [localMessage, setLocalMessage] = useState(maintenance.message);
  const [isNotifying, setIsNotifying] = useState(false);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/maintenance/notify");
      if (res.ok) {
        setQueueStats(await res.json());
      }
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveMaintenance = async () => {
    const scheduledAt = localScheduledAt ? parseDateTimeLocal(localScheduledAt) : null;
    setSettings({
      ...settings,
      scheduledMaintenance: {
        enabled: maintenance.enabled,
        scheduledAt: scheduledAt?.toISOString() ?? null,
        message: localMessage,
        notified: maintenance.notified,
      },
    });
    await handleSave();
  };

  const handleEnableChange = async (enabled: boolean) => {
    const scheduledAt = localScheduledAt ? parseDateTimeLocal(localScheduledAt) : null;
    setSettings({
      ...settings,
      scheduledMaintenance: {
        enabled,
        scheduledAt: scheduledAt?.toISOString() ?? null,
        message: localMessage,
        notified: false,
      },
    });
    await handleSave();
  };

  const handleScheduleChange = (value: string) => {
    setLocalScheduledAt(value);
  };

  const handleMessageChange = (value: string) => {
    setLocalMessage(value);
  };

  const handleNotifyUsers = async () => {
    if (!localScheduledAt) {
      toast.error("Set a maintenance schedule first");
      return;
    }

    setIsNotifying(true);
    try {
      const response = await fetch("/api/admin/maintenance/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: localMessage,
          scheduledAt: localScheduledAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to queue notifications");
      }

      setSettings({
        ...settings,
        scheduledMaintenance: {
          ...maintenance,
          notified: true,
        },
      });
      await handleSave();

      toast.success(`${data.queued} emails queued for sending`);
      fetchStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to queue notifications");
    } finally {
      setIsNotifying(false);
    }
  };

  const isScheduled = maintenance.enabled && maintenance.scheduledAt;
  const scheduledDate = maintenance.scheduledAt ? new Date(maintenance.scheduledAt) : null;
  const isPast = Boolean(scheduledDate && scheduledDate < new Date());
  const stats = queueStats?.stats;

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Operations"
        description="Scheduled maintenance and default stock locations"
      />

      <SettingsSection title="System">
        <SettingsRow
          title="Scheduled maintenance"
          description="Plan maintenance windows — users are notified in advance"
        >
          <div className="flex items-center gap-3">
            <Switch
              checked={maintenance.enabled}
              onCheckedChange={handleEnableChange}
              disabled={Boolean(isScheduled && isPast)}
            />
            <Label className="text-sm font-medium">
              {maintenance.enabled ? "Maintenance scheduled" : "Schedule maintenance"}
            </Label>
          </div>
        </SettingsRow>

        {maintenance.enabled && (
          <div className="mt-4 p-4 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Date & time</Label>
                <Input
                  type="datetime-local"
                  value={localScheduledAt}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  min={formatDateTimeLocal(new Date())}
                  disabled={isPast}
                  className="mt-1 w-full"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={localMessage}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  rows={3}
                  placeholder="Message shown to users during maintenance"
                  disabled={isPast}
                  className="mt-1 w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={handleSaveMaintenance}
                disabled={!localScheduledAt}
              >
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Save schedule
              </DashboardButton>
              {maintenance.notified ? (
                <Badge variant="secondary">Users notified</Badge>
              ) : (
                <DashboardButton
                  variant="outline"
                  size="sm"
                  onClick={handleNotifyUsers}
                  disabled={isNotifying || !localScheduledAt || !queueStats?.configured}
                >
                  {isNotifying ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bell className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isNotifying ? "Queuing..." : "Notify users now"}
                </DashboardButton>
              )}
            </div>
            {!queueStats?.configured && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Redis is not configured. Set REDIS_URL to enable email notifications.
              </p>
            )}
            {isPast && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Maintenance window has started — non-admin access is blocked.
              </p>
            )}
            {!localScheduledAt && (
              <p className="text-xs text-muted-foreground">
                Set a date and time to activate maintenance mode.
              </p>
            )}

            {stats && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Email queue</p>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Waiting: {stats.waiting}
                  </span>
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    Active: {stats.active}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Done: {stats.completed}
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-500" />
                    Failed: {stats.failed}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    Delayed: {stats.delayed}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Stock location templates"
        description="Defaults for new pharmacies — stores manage their own in pharmacy settings"
      >
        {stockLocations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">
            No template locations yet. Add a default warehouse or shelf location.
          </p>
        ) : (
          stockLocations.map((location) => (
            <SettingsRow
              key={location.id}
              title={location.name}
              description={location.description ?? undefined}
            >
              <AdminStatusChip tone="active">Active</AdminStatusChip>
            </SettingsRow>
          ))
        )}
        <div className="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
          <DashboardButton onClick={() => setIsAddLocationOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            Add location
          </DashboardButton>
        </div>
      </SettingsSection>
    </div>
  );
}
