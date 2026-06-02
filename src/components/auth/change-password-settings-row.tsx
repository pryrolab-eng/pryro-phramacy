"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { DashboardButton } from "@/components/dashboard";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { useDashboardGraceNav } from "@/hooks/useDashboardGraceNav";

type Props = {
  description?: string;
};

export function ChangePasswordSettingsRow({
  description = "Update the password you use to sign in to Pryrox.",
}: Props) {
  const [open, setOpen] = useState(false);
  const { canChangePassword, lockedHint } = useDashboardGraceNav();

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Password</p>
          <p className="text-xs text-muted-foreground">
            {canChangePassword
              ? description
              : `Unavailable while access is paused (${lockedHint.toLowerCase()}).`}
          </p>
        </div>
        <DashboardButton
          type="button"
          tone="outline"
          size="sm"
          disabled={!canChangePassword}
          title={
            canChangePassword
              ? undefined
              : `Unavailable — ${lockedHint}`
          }
          onClick={() => setOpen(true)}
        >
          <KeyRound className="mr-1.5 size-3.5" />
          Change password
        </DashboardButton>
      </div>
      {canChangePassword ? (
        <ChangePasswordDialog open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
