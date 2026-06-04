"use client";

import { DashboardConfirmDialog } from "@/components/dashboard/dashboard-alert-dialog";

const SIGN_OUT_URL = "/api/auth/signout";

type SignOutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "admin" | "pharmacy";
};

/** In-app sign-out confirmation (replaces window.confirm). */
export function SignOutConfirmDialog({
  open,
  onOpenChange,
  variant = "pharmacy",
}: SignOutConfirmDialogProps) {
  return (
    <DashboardConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out?"
      description={
        variant === "admin"
          ? "You will leave the platform admin console and need to sign in again."
          : "You will need to sign in again to access your pharmacy workspace."
      }
      confirmLabel="Sign out"
      confirmTone="destructive"
      onConfirm={() => {
        window.location.href = SIGN_OUT_URL;
      }}
    />
  );
}
