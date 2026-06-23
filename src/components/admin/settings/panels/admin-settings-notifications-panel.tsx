"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardButton } from "@/components/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  SettingsPanelTitle,
  SettingsSection,
  SettingsRow,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

const TEMPLATE_INFO: Record<string, { label: string; desc: string }> = {
  "auth.signup_confirm": {
    label: "Signup confirmation",
    desc: "Sent to new users to verify their email address",
  },
  "auth.password_reset": {
    label: "Password reset",
    desc: "Sent when a user requests to reset their password",
  },
  "auth.staff_invite": {
    label: "Staff invitation",
    desc: "Sent to new staff members added by pharmacy owners",
  },
  "billing.payment_receipt": {
    label: "Payment receipt",
    desc: "Sent to pharmacy owners after successful subscription checkout",
  },
  "platform.admin_notice": {
    label: "Administrative notice",
    desc: "Rare alerts or announcements broadcast to all platform users",
  },
};

export function AdminSettingsNotificationsPanel() {
  const { settings, setSettings } = useAdminSettings();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load email templates:", err);
        setLoading(false);
      });
  }, []);

  const handleEditClick = (tpl: any) => {
    setEditingTemplate(tpl);
    setSubject(tpl.subject || "");
    setHtml(tpl.html || "");
    setText(tpl.text || "");
    setIsActive(tpl.is_active !== false);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      setSaving(true);
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: editingTemplate.template_key,
          subject,
          html,
          text,
          isActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Email template updated successfully");
        setTemplates((prev) =>
          prev.map((t) =>
            t.template_key === editingTemplate.template_key
              ? { ...t, subject, html, text, is_active: isActive }
              : t,
          ),
        );
        setEditingTemplate(null);
      } else {
        toast.error(data.error || "Failed to save email template");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save email template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Notifications"
        description="Platform-wide notification delivery and system email templates"
      />

      <SettingsSection title="Delivery">
        <SettingsRow
          title="System notifications"
          description="Send email and in-app alerts for platform events"
        >
          <Switch
            checked={settings.enableNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableNotifications: checked })
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Email templates"
        description="Configure copy and design for automated system emails"
      >
        {loading ? (
          <div className="px-5 py-6 text-sm text-neutral-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="px-5 py-6 text-sm text-neutral-500">No templates found.</div>
        ) : (
          templates.map((tpl) => {
            const info = TEMPLATE_INFO[tpl.template_key] || {
              label: tpl.template_key,
              desc: "Custom system email template",
            };
            return (
              <SettingsRow
                key={tpl.id}
                title={info.label}
                description={info.desc}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={tpl.is_active ? "default" : "secondary"}>
                    {tpl.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <DashboardButton size="sm" onClick={() => handleEditClick(tpl)}>
                    Edit template
                  </DashboardButton>
                </div>
              </SettingsRow>
            );
          })
        )}
      </SettingsSection>

      {/* Template Editor Dialog */}
      <Dialog open={editingTemplate !== null} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Email Template: {editingTemplate ? (TEMPLATE_INFO[editingTemplate.template_key]?.label || editingTemplate.template_key) : ""}
            </DialogTitle>
            <DialogDescription>
              Modify the subject line, HTML content, and plaintext version. Use variables like{" "}
              <code className="font-mono text-purple-600 font-semibold">{`{{actionUrl}}`}</code>,{" "}
              <code className="font-mono text-purple-600 font-semibold">{`{{pharmacyName}}`}</code>, or{" "}
              <code className="font-mono text-purple-600 font-semibold">{`{{message}}`}</code> depending on the template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <Label htmlFor="isActive" className="font-medium">Active status</Label>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="html">HTML Body</Label>
              <Textarea
                id="html"
                rows={12}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="<h2>Hello!</h2><p>This is HTML email body</p>"
                className="font-mono text-xs"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="text">Plaintext Fallback (Optional)</Label>
              <Textarea
                id="text"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Plain text email copy..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <DashboardButton type="button" onClick={() => setEditingTemplate(null)}>
              Cancel
            </DashboardButton>
            <DashboardButton tone="primary" onClick={handleSaveTemplate} disabled={saving}>
              {saving ? "Saving..." : "Save template"}
            </DashboardButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
