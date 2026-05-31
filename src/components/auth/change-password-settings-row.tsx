"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { DashboardButton } from "@/components/dashboard";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";

type Props = {
  description?: string;
};

export function ChangePasswordSettingsRow({
  description = "Update the password you use to sign in to Pryrox.",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Password</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <DashboardButton
          type="button"
          tone="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <KeyRound className="mr-1.5 size-3.5" />
          Change password
        </DashboardButton>
      </div>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
