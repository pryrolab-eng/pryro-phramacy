"use client";

import { Edit, Save, X } from "lucide-react";
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
  SettingsPanelDivider,
} from "@/components/settings/settings-primitives";
import { useSettingsPage } from "@/components/settings/settings-page-provider";

export function SettingsGeneralPanel() {
  const {
    pharmacyInfo,
    editInfo,
    setEditInfo,
    isEditing,
    setIsEditing,
    handleSaveEdit,
  } = useSettingsPage();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="General"
        description="Pharmacy profile, regional preferences, and defaults"
        action={
          !isEditing ? (
            <DashboardButton onClick={() => setIsEditing(true)}>
              <Edit className="mr-1.5 h-4 w-4" />
              Edit
            </DashboardButton>
          ) : null
        }
      />

      <SettingsSection title="Pharmacy profile">
        {!isEditing ? (
          <>
            <SettingsRow title="Name" description="Legal or trading name">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {pharmacyInfo.name || "—"}
              </span>
            </SettingsRow>
            <SettingsRow title="License" description="Pharmacy license number">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {pharmacyInfo.license || "—"}
              </span>
            </SettingsRow>
            <SettingsRow title="Location">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {pharmacyInfo.location || "—"}
              </span>
            </SettingsRow>
            <SettingsRow title="Phone">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {pharmacyInfo.phone || "—"}
              </span>
            </SettingsRow>
            <SettingsRow title="Email">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {pharmacyInfo.email || "—"}
              </span>
            </SettingsRow>
          </>
        ) : (
          <div className="space-y-4 px-5 py-4">
            <div className="grid gap-2">
              <Label>Pharmacy name</Label>
              <Input
                value={editInfo.name}
                onChange={(e) => setEditInfo({ ...editInfo, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={editInfo.location}
                onChange={(e) =>
                  setEditInfo({ ...editInfo, location: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={editInfo.phone}
                  onChange={(e) =>
                    setEditInfo({ ...editInfo, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editInfo.email}
                  onChange={(e) =>
                    setEditInfo({ ...editInfo, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <DashboardButton tone="primary" onClick={() => void handleSaveEdit()}>
                <Save className="mr-1.5 h-4 w-4" />
                Save
              </DashboardButton>
              <DashboardButton onClick={() => setIsEditing(false)}>
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </DashboardButton>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsPanelDivider />

      <SettingsSection
        title="My settings"
        description="Regional defaults for POS and reports"
      >
        <SettingsRow
          title="Currency"
          description="Default currency for sales and invoices"
        >
          <Select
            value={editInfo.currency}
            onValueChange={(v) => setEditInfo({ ...editInfo, currency: v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RWF">Rwandan Franc (RWF)</SelectItem>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
              <SelectItem value="UGX">Ugandan Shilling (UGX)</SelectItem>
              <SelectItem value="TZS">Tanzanian Shilling (TZS)</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow title="Language" description="Interface language">
          <Select
            value={editInfo.language}
            onValueChange={(v) => setEditInfo({ ...editInfo, language: v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="rw">Kinyarwanda</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="sw">Kiswahili</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      {!isEditing && (
        <DashboardButton tone="primary" onClick={() => void handleSaveEdit()}>
          Save preferences
        </DashboardButton>
      )}
    </div>
  );
}
