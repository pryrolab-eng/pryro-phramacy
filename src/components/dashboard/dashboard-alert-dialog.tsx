"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { DashboardButton, type DashboardButtonTone } from "./dashboard-button";
import { dashboardDialogText, dashboardSurfaces } from "./dashboard-tokens";

export {
  AlertDialog,
  AlertDialogTrigger,
};

export const DashboardAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogContent>,
  React.ComponentPropsWithoutRef<typeof AlertDialogContent>
>(({ className, ...props }, ref) => (
  <AlertDialogContent
    ref={ref}
    className={cn(
      "gap-0 overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-0 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-w-md",
      className,
    )}
    {...props}
  />
));
DashboardAlertDialogContent.displayName = "DashboardAlertDialogContent";

export function DashboardAlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <AlertDialogHeader
      className={cn(dashboardSurfaces.dialogHeader, "space-y-1 text-left", className)}
      {...props}
    />
  );
}

export const DashboardAlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogTitle>,
  React.ComponentPropsWithoutRef<typeof AlertDialogTitle>
>(({ className, ...props }, ref) => (
  <AlertDialogTitle
    ref={ref}
    className={cn(dashboardDialogText.title, className)}
    {...props}
  />
));
DashboardAlertDialogTitle.displayName = "DashboardAlertDialogTitle";

export const DashboardAlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogDescription>,
  React.ComponentPropsWithoutRef<typeof AlertDialogDescription>
>(({ className, ...props }, ref) => (
  <AlertDialogDescription
    ref={ref}
    className={cn(dashboardDialogText.description, className)}
    {...props}
  />
));
DashboardAlertDialogDescription.displayName = "DashboardAlertDialogDescription";

type AlertActionsProps = {
  cancelLabel?: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmTone?: DashboardButtonTone;
};

export function DashboardAlertDialogActions({
  cancelLabel = "Cancel",
  confirmLabel,
  onCancel,
  onConfirm,
  confirmTone = "destructive",
}: AlertActionsProps) {
  return (
    <AlertDialogFooter className={dashboardSurfaces.dialogFooter}>
      <AlertDialogCancel asChild onClick={onCancel}>
        <DashboardButton>{cancelLabel}</DashboardButton>
      </AlertDialogCancel>
      <AlertDialogAction asChild onClick={onConfirm}>
        <DashboardButton tone={confirmTone}>{confirmLabel}</DashboardButton>
      </AlertDialogAction>
    </AlertDialogFooter>
  );
}
