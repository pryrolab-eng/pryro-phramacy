"use client";

import {
  AlertDialog,
  DashboardAlertDialogContent,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
  DashboardAlertDialogDescription,
  DashboardAlertDialogActions,
} from "@/components/dashboard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export function BillingCancelDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <DashboardAlertDialogContent>
        <DashboardAlertDialogHeader>
          <DashboardAlertDialogTitle>Cancel subscription?</DashboardAlertDialogTitle>
          <DashboardAlertDialogDescription>
            This cancels the subscription immediately. Branches may lose access
            if no active plan remains.
          </DashboardAlertDialogDescription>
        </DashboardAlertDialogHeader>
        <DashboardAlertDialogActions
          cancelLabel="Keep subscription"
          confirmLabel={isPending ? "Cancelling…" : "Yes, cancel"}
          confirmTone="destructive"
          onCancel={() => onOpenChange(false)}
          onConfirm={onConfirm}
        />
      </DashboardAlertDialogContent>
    </AlertDialog>
  );
}
