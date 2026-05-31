"use client";

import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import { useStaffSettingsPage } from "@/components/staff/staff-settings-page-provider";

export function StaffSettingsDialogs() {
  const s = useStaffSettingsPage();

  return (
    <Dialog
      open={s.is2FASetupOpen}
      onOpenChange={(open) => {
        s.setIs2FASetupOpen(open);
        if (!open) s.resetTwoFaSetup();
      }}
    >
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
                    toast.success("2FA enabled");
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
              <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                {s.backupCodes.map((code) => (
                  <li key={code} className="rounded bg-muted px-2 py-1">
                    {code}
                  </li>
                ))}
              </ul>
              <DashboardButton
                tone="primary"
                className="w-full"
                onClick={() => {
                  s.setIs2FASetupOpen(false);
                  s.resetTwoFaSetup();
                }}
              >
                Done
              </DashboardButton>
            </div>
          )}
        </DashboardDialogBody>
        {s.setupStep !== "backup" ? (
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Close"
            onCancel={() => {
              s.setIs2FASetupOpen(false);
              s.resetTwoFaSetup();
            }}
            onConfirm={() => {
              s.setIs2FASetupOpen(false);
              s.resetTwoFaSetup();
            }}
          />
        ) : null}
      </DashboardDialogContent>
    </Dialog>
  );
}
