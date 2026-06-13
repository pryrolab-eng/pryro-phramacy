"use client";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { IpWhitelistManageFields } from "@/components/security/ip-whitelist-manage-fields";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
  DashboardButton,
} from "@/components/dashboard";
import { useSettingsPage } from "@/components/settings/settings-page-provider";

export function SettingsDialogs() {
  const s = useSettingsPage();

  return (
    <>
      <Dialog open={s.isAddLocationOpen} onOpenChange={s.setIsAddLocationOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add location</DashboardDialogTitle>
            <DashboardDialogDescription>
              Create a stock location for inventory tracking
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label>Location name</Label>
              <Input
                value={s.newLocation.name}
                onChange={(e) =>
                  s.setNewLocation({ ...s.newLocation, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
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
            onConfirm={() => void s.handleAddLocation()}
            confirmDisabled={!s.newLocation.name.trim()}
          />
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

      <Dialog open={s.isIpWhitelistOpen} onOpenChange={s.setIsIpWhitelistOpen}>
        <DashboardDialogContent className="sm:max-w-lg">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Pharmacy IP whitelist</DashboardDialogTitle>
            <DashboardDialogDescription>
              Allowed addresses for this pharmacy workspace
              {s.currentIp ? (
                <>
                  {" "}
                  — your IP:{" "}
                  <span className="font-mono">{s.currentIp}</span>
                </>
              ) : null}
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody>
            <IpWhitelistManageFields
              ips={s.ipWhitelist}
              newIp={s.newIp}
              onNewIpChange={s.setNewIp}
              addPending={s.addIpMutation.isPending}
              onAdd={async (body) => {
                await s.addIpMutation.mutateAsync(body);
              }}
              onRemove={async (id) => {
                await s.removeIpMutation.mutateAsync(id);
              }}
            />
          </DashboardDialogBody>
        </DashboardDialogContent>
      </Dialog>
    </>
  );
}
