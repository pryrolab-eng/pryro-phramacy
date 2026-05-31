"use client";

import { KeyRound } from "lucide-react";
import {
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
} from "@/components/dashboard";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardDialogContent className="sm:max-w-md">
        <DashboardDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <KeyRound className="size-5" />
          </div>
          <DashboardDialogTitle>Change password</DashboardDialogTitle>
          <DashboardDialogDescription>
            Enter your current password, then choose a new one.
          </DashboardDialogDescription>
        </DashboardDialogHeader>
        <DashboardDialogBody>
          <ChangePasswordForm
            onSuccess={() => onOpenChange(false)}
            submitLabel="Save new password"
          />
        </DashboardDialogBody>
      </DashboardDialogContent>
    </Dialog>
  );
}
