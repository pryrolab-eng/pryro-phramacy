"use client";

import { useCallback, useEffect, useState } from "react";
import { Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  getAdminPharmacyBranding,
  updateAdminPharmacyBranding,
  uploadAdminPharmacyLogo,
} from "@/lib/http/admin/pharmacies";
import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";

const DEFAULT_FORM: PharmacyBranding = {
  platformName: "",
  logoUrl: "",
  primaryColor: "#171717",
  customDomain: "",
};

type Props = {
  pharmacyId: string;
};

export function AdminPharmacyBrandingSection({ pharmacyId }: Props) {
  const [form, setForm] = useState<PharmacyBranding>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminPharmacyBranding(pharmacyId);
      setForm(data);
    } catch (e) {
      toast.error("Could not load branding", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [pharmacyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadAdminPharmacyLogo(pharmacyId, file);
      setForm((f) => ({ ...f, logoUrl: url }));
      toast.success("Logo uploaded", {
        description: "Stored on CDN when Cloudinary is configured.",
      });
    } catch (e) {
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminPharmacyBranding(pharmacyId, form);
      toast.success("Branding saved");
    } catch (e) {
      toast.error("Could not save branding", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading branding…
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Palette className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold leading-none">Customization</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Logo and colors shown in the app for all users on this pharmacy.
            Requires the customization plan feature for self-serve edits.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="admin-pharmacy-platform-name">Platform name</Label>
          <Input
            id="admin-pharmacy-platform-name"
            placeholder="Apex Pharmacy"
            value={form.platformName}
            onChange={(e) =>
              setForm({ ...form, platformName: e.target.value })
            }
          />
        </div>
        {form.logoUrl ? (
          <img
            src={form.logoUrl}
            alt="Pharmacy logo"
            className="h-14 w-auto max-w-[200px] rounded border object-contain p-1"
          />
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="admin-pharmacy-logo">Company logo</Label>
          <Input
            id="admin-pharmacy-logo"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-pharmacy-primary">Primary color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={form.primaryColor}
              onChange={(e) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
              className="h-9 w-14 cursor-pointer p-1"
            />
            <Input
              id="admin-pharmacy-primary"
              value={form.primaryColor}
              onChange={(e) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-pharmacy-domain">Custom domain</Label>
          <Input
            id="admin-pharmacy-domain"
            placeholder="pharmacy.example.com"
            value={form.customDomain}
            onChange={(e) =>
              setForm({ ...form, customDomain: e.target.value })
            }
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? "Saving…" : "Save branding"}
        </Button>
      </div>
    </section>
  );
}
