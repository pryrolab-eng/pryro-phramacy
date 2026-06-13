"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { DashboardButton } from "@/components/dashboard";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { SettingsRow } from "@/components/settings/settings-primitives";
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
      <SettingsRow
        title="Password"
        description={
          canChangePassword
            ? description
            : `Unavailable while access is paused (${lockedHint.toLowerCase()}).`
        }
      >
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
      </SettingsRow>
      {canChangePassword ? (
        <ChangePasswordDialog open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
