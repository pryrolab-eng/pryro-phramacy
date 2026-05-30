"use client";

import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DashboardButton,
  DashboardDialogActions,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogHeader,
  DashboardDialogTitle,
} from "@/components/dashboard";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsDialogs() {
  const s = useAdminSettings();

  return (
    <>
      <Dialog open={s.isAddLocationOpen} onOpenChange={s.setIsAddLocationOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add location</DashboardDialogTitle>
            <DashboardDialogDescription>
              Default template for new pharmacies. Per-store locations are managed in
              pharmacy settings.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Location name</Label>
              <Input
                placeholder="e.g. Main warehouse"
                value={s.newLocation.name}
                onChange={(e) =>
                  s.setNewLocation({ ...s.newLocation, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional"
                value={s.newLocation.description}
                onChange={(e) =>
                  s.setNewLocation({
                    ...s.newLocation,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Add location"
            onCancel={() => s.setIsAddLocationOpen(false)}
            onConfirm={() => s.handleAddLocation()}
            confirmDisabled={!s.newLocation.name.trim()}
            confirmLoading={s.createLocationPending}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={s.isAddApiKeyOpen} onOpenChange={s.setIsAddApiKeyOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add platform API key</DashboardDialogTitle>
          </DashboardDialogHeader>
          <DashboardDialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={s.newApiKey.name}
                onChange={(e) =>
                  s.setNewApiKey({ ...s.newApiKey, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Key</Label>
              <Input
                value={s.newApiKey.key}
                onChange={(e) =>
                  s.setNewApiKey({ ...s.newApiKey, key: e.target.value })
                }
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            confirmLabel="Add key"
            onCancel={() => {
              s.setIsAddApiKeyOpen(false);
              s.setNewApiKey({ name: "", key: "" });
            }}
            onConfirm={async () => {
              try {
                await s.createApiKeyMutation.mutateAsync(s.newApiKey);
                s.setIsAddApiKeyOpen(false);
                s.setNewApiKey({ name: "", key: "" });
                toast.success("API key added");
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Failed to add key",
                );
              }
            }}
            confirmDisabled={!s.newApiKey.name || !s.newApiKey.key}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={s.isEditApiKeyOpen} onOpenChange={s.setIsEditApiKeyOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Edit platform API key</DashboardDialogTitle>
          </DashboardDialogHeader>
          {s.selectedApiKey ? (
            <DashboardDialogBody className="grid gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={String(s.selectedApiKey.name ?? "")}
                  onChange={(e) =>
                    s.setSelectedApiKey((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Key</Label>
                <Input
                  value={String(s.selectedApiKey.key ?? "")}
                  onChange={(e) =>
                    s.setSelectedApiKey((prev) =>
                      prev ? { ...prev, key: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={String(s.selectedApiKey.status ?? "Active")}
                  onValueChange={(value) =>
                    s.setSelectedApiKey((prev) =>
                      prev ? { ...prev, status: value } : prev,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DashboardDialogBody>
          ) : null}
          <DashboardDialogActions
            confirmLabel="Save"
            onCancel={() => s.setIsEditApiKeyOpen(false)}
            onConfirm={async () => {
              if (!s.selectedApiKey) return;
              try {
                await s.updateApiKeyMutation.mutateAsync({
                  id: s.selectedApiKey.id,
                  name: s.selectedApiKey.name,
                  key: String(s.selectedApiKey.key ?? ""),
                  status: String(s.selectedApiKey.status ?? "Active"),
                });
                s.setIsEditApiKeyOpen(false);
                toast.success("API key updated");
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Update failed",
                );
              }
            }}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={s.isIpWhitelistOpen} onOpenChange={s.setIsIpWhitelistOpen}>
        <DashboardDialogContent className="sm:max-w-lg">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Platform IP whitelist</DashboardDialogTitle>
            <DashboardDialogDescription>
              Allowed addresses for platform admin access
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="192.168.1.100"
                value={s.newIp.ip}
                onChange={(e) => s.setNewIp({ ...s.newIp, ip: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={s.newIp.description}
                onChange={(e) =>
                  s.setNewIp({ ...s.newIp, description: e.target.value })
                }
              />
            </div>
            <DashboardButton
              onClick={async () => {
                if (!s.newIp.ip) return;
                try {
                  const result = await s.addIpMutation.mutateAsync(s.newIp);
                  if (result.success) {
                    s.setNewIp({ ip: "", description: "" });
                    toast.success("IP added");
                  } else {
                    toast.error("Failed to add IP");
                  }
                } catch {
                  toast.error("Failed to add IP");
                }
              }}
              disabled={!s.newIp.ip}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add IP
            </DashboardButton>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-neutral-200/80 p-3 dark:border-neutral-700">
              {s.ipWhitelist.length === 0 ? (
                <p className="text-center text-sm text-neutral-500">
                  No whitelisted IPs yet
                </p>
              ) : (
                s.ipWhitelist.map((ip) => (
                  <div
                    key={ip.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800"
                  >
                    <div>
                      <p className="text-sm font-medium">{ip.ip_address}</p>
                      <p className="text-xs text-neutral-500">{ip.description}</p>
                    </div>
                    <DashboardButton
                      size="sm"
                      onClick={async () => {
                        try {
                          await s.removeIpMutation.mutateAsync(ip.id);
                          toast.success("IP removed");
                        } catch {
                          toast.error("Failed to remove IP");
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </DashboardButton>
                  </div>
                ))
              )}
            </div>
          </DashboardDialogBody>
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={s.is2FASetupOpen} onOpenChange={s.setIs2FASetupOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Two-factor authentication</DashboardDialogTitle>
            <DashboardDialogDescription>
              {s.setupStep === "qr" && "Scan the QR code with your authenticator app"}
              {s.setupStep === "verify" && "Enter the 6-digit code from your app"}
              {s.setupStep === "backup" && "Save these backup codes securely"}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody>
            {s.setupStep === "qr" &&
              (s.qrCode ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={s.qrCode} alt="QR Code" className="size-48" />
                  <DashboardButton
                    tone="primary"
                    className="w-full"
                    onClick={() => s.setSetupStep("verify")}
                  >
                    Next
                  </DashboardButton>
                </div>
              ) : (
                <DashboardButton
                  tone="primary"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const data = await s.setupTwoFaMutation.mutateAsync();
                      s.setQrCode(data.qrCode);
                      s.setBackupCodes(data.backupCodes);
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Setup failed",
                      );
                    }
                  }}
                >
                  Generate QR code
                </DashboardButton>
              ))}
            {s.setupStep === "verify" && (
              <div className="space-y-4">
                <Input
                  placeholder="000000"
                  value={s.verifyCode}
                  onChange={(e) =>
                    s.setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                />
                <DashboardButton
                  tone="primary"
                  className="w-full"
                  disabled={s.verifyCode.length !== 6}
                  onClick={async () => {
                    try {
                      await s.verifyTwoFaMutation.mutateAsync(s.verifyCode);
                      s.setSetupStep("backup");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Invalid code",
                      );
                    }
                  }}
                >
                  Verify
                </DashboardButton>
              </div>
            )}
            {s.setupStep === "backup" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 font-mono text-xs dark:border-amber-900 dark:bg-amber-950/40">
                  {s.backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="rounded bg-white px-2 py-1 dark:bg-neutral-900"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <DashboardButton
                  tone="primary"
                  className="w-full"
                  onClick={() => {
                    void s.twoFaQuery.refetch();
                    s.setIs2FASetupOpen(false);
                    s.setSetupStep("qr");
                    s.setQrCode("");
                    s.setVerifyCode("");
                    toast.success("2FA enabled");
                  }}
                >
                  Done
                </DashboardButton>
              </div>
            )}
          </DashboardDialogBody>
        </DashboardDialogContent>
      </Dialog>
    </>
  );
}
