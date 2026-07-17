"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Code2 } from "lucide-react";
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
import {
  EmailTemplatePreview,
  HtmlCodeEditor,
} from "@/components/admin/settings/email-template-editor";
import { cn } from "@/lib/utils";

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

type EditorTab = "edit" | "preview";

export function AdminSettingsNotificationsPanel() {
  const { settings, setSettings } = useAdminSettings();

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>("edit");

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
    setEditorTab("edit");
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

  const templateLabel = editingTemplate
    ? TEMPLATE_INFO[editingTemplate.template_key]?.label ||
      editingTemplate.template_key
    : "";

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
          <div className="px-5 py-6 text-sm text-neutral-500">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="px-5 py-6 text-sm text-neutral-500">
            No templates found.
          </div>
        ) : (
          templates.map((tpl) => {
            const info = TEMPLATE_INFO[tpl.template_key] || {
              label: tpl.template_key,
              desc: "Custom system email template",
            };
            return (
              <SettingsRow key={tpl.id} title={info.label} description={info.desc}>
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

      <Dialog
        open={editingTemplate !== null}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <DialogTitle>Edit Email Template: {templateLabel}</DialogTitle>
            <DialogDescription>
              Edit HTML with syntax colors, then switch to Preview to see the
              rendered email. Variables like{" "}
              <code className="rounded bg-primary/10 px-1 font-mono text-xs text-primary">
                {"{{actionUrl}}"}
              </code>{" "}
              are filled with sample data in preview.
            </DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-6 py-2 dark:border-neutral-800">
            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => setEditorTab("edit")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  editorTab === "edit"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400",
                )}
              >
                <Code2 className="size-3.5" strokeWidth={1.75} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setEditorTab("preview")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  editorTab === "preview"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400",
                )}
              >
                <Eye className="size-3.5" strokeWidth={1.75} />
                Preview
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="isActive" className="text-xs text-neutral-500">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {editorTab === "edit" ? (
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="subject">Subject line</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject line"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="html">HTML body</Label>
                  <HtmlCodeEditor
                    id="html"
                    value={html}
                    onChange={setHtml}
                    rows={16}
                    placeholder="<h2>Hello!</h2><p>This is HTML email body</p>"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="text">Plaintext fallback (optional)</Label>
                  <Textarea
                    id="text"
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Plain text email copy..."
                    className="rounded-lg border-neutral-200 bg-neutral-50 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900/40"
                  />
                </div>
              </div>
            ) : (
              <EmailTemplatePreview subject={subject} html={html} />
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-neutral-200 px-6 py-3 dark:border-neutral-800">
            <DashboardButton
              type="button"
              onClick={() => setEditingTemplate(null)}
            >
              Cancel
            </DashboardButton>
            <DashboardButton
              tone="primary"
              onClick={handleSaveTemplate}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save template"}
            </DashboardButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
