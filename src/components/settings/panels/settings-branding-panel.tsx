"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardButton } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { usePharmacyBranding } from "@/hooks/usePharmacyBranding";
import {
  useUpdatePharmacyBrandingMutation,
  useUploadPharmacyLogoMutation,
} from "@/hooks/usePharmacySettingsPage";
import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";

export function SettingsBrandingPanel() {
  const { activePharmacyId } = useActivePharmacy();
  const { can, isEntitlementsReady } = usePharmacyEntitlements();
  const hasCustomization = isEntitlementsReady && can("customization");
  const brandingQuery = usePharmacyBranding(activePharmacyId, {
    enabled: hasCustomization,
  });
  const updateMutation = useUpdatePharmacyBrandingMutation();
  const uploadMutation = useUploadPharmacyLogoMutation();

  const [form, setForm] = useState<PharmacyBranding>({
    platformName: "",
    logoUrl: "",
    primaryColor: "#171717",
    customDomain: "",
  });

  useEffect(() => {
    if (brandingQuery.data) setForm(brandingQuery.data);
  }, [brandingQuery.data]);

  const handleLogoUpload = async (file: File) => {
    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setForm((f) => ({ ...f, logoUrl: url }));
      toast.success("Logo uploaded", {
        description: "Visible to everyone on this pharmacy account.",
      });
    } catch (e) {
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(form);
      toast.success("Branding saved", {
        description: "Sidebar and theme update for this pharmacy.",
      });
    } catch (e) {
      toast.error("Could not save branding", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
      <div className="space-y-8">
        <SettingsPanelTitle
          title="Branding"
          description="Requires the customization plan — set your platform name, logo, and colors for the sidebar"
        />

        <SettingsSection title="Pharmacy appearance">
          <div className="space-y-4 px-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pharmacy-platform-name">Platform name</Label>
              <Input
                id="pharmacy-platform-name"
                placeholder="Apex Pharmacy"
                value={form.platformName}
                onChange={(e) =>
                  setForm({ ...form, platformName: e.target.value })
                }
              />
              <p className="text-xs text-neutral-500">
                Shown in the sidebar instead of Pryrox. Leave empty to use
                your pharmacy name from profile.
              </p>
            </div>
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Pharmacy logo preview"
                className="h-14 w-auto max-w-[200px] rounded border border-neutral-200/80 object-contain p-1 dark:border-neutral-700"
              />
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="pharmacy-logo">Company logo</Label>
              <Input
                id="pharmacy-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={uploadMutation.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogoUpload(file);
                }}
              />
              <p className="text-xs text-neutral-500">
                Shown in the sidebar for all users on this pharmacy. PNG or SVG
                recommended.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pharmacy-primary">Primary color</Label>
              <div className="flex gap-2">
                <Input
                  id="pharmacy-primary-swatch"
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) =>
                    setForm({ ...form, primaryColor: e.target.value })
                  }
                  className="h-9 w-14 cursor-pointer p-1"
                />
                <Input
                  id="pharmacy-primary"
                  value={form.primaryColor}
                  onChange={(e) =>
                    setForm({ ...form, primaryColor: e.target.value })
                  }
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pharmacy-domain">Custom domain</Label>
              <Input
                id="pharmacy-domain"
                placeholder="pharmacy.yourdomain.com"
                value={form.customDomain}
                onChange={(e) =>
                  setForm({ ...form, customDomain: e.target.value })
                }
              />
              <p className="text-xs text-neutral-500">
                Optional. Used when you configure a custom hostname for this
                pharmacy.
              </p>
            </div>
            <DashboardButton
              tone="primary"
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {updateMutation.isPending ? "Saving…" : "Save branding"}
            </DashboardButton>
          </div>
        </SettingsSection>
      </div>
  );
}
