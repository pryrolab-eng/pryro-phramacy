"use client";

import { DashboardButton, type DashboardButtonTone } from "./dashboard-button";
import { DashboardDialogFooter } from "./dashboard-dialog";

type Props = {
  cancelLabel?: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmTone?: DashboardButtonTone;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  className?: string;
};

/** Standard cancel + confirm row for dashboard dialogs. */
export function DashboardDialogActions({
  cancelLabel = "Cancel",
  confirmLabel,
  onCancel,
  onConfirm,
  confirmTone = "primary",
  confirmDisabled,
  confirmLoading,
  className,
}: Props) {
  return (
    <DashboardDialogFooter className={className}>
      {onCancel ? (
        <DashboardButton type="button" onClick={onCancel}>
          {cancelLabel}
        </DashboardButton>
      ) : null}
      <DashboardButton
        type="button"
        tone={confirmTone}
        onClick={onConfirm}
        disabled={confirmDisabled || confirmLoading}
      >
        {confirmLoading ? "Please wait…" : confirmLabel}
      </DashboardButton>
    </DashboardDialogFooter>
  );
}
