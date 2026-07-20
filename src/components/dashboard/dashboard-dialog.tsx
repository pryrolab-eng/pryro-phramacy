"use client";

import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { dashboardDialogText, dashboardSurfaces } from "./dashboard-tokens";

/** Re-export primitives unchanged */
export { Dialog, DialogTrigger, DialogClose };

const contentBase =
  "fixed left-[50%] top-[50%] z-[120] flex w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-1.5rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:w-full sm:max-w-lg";

export const DashboardDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent> & {
    portalContainer?: HTMLElement | null;
  }
>(({ className, children, portalContainer, ...props }, ref) => (
  <DialogContent
    ref={ref}
    portalContainer={portalContainer}
    className={cn(contentBase, dashboardSurfaces.dialog, className)}
    {...props}
  >
    {children}
  </DialogContent>
));
DashboardDialogContent.displayName = "DashboardDialogContent";

export function DashboardDialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <DialogHeader
      className={cn(
        dashboardSurfaces.dialogHeader,
        "shrink-0 space-y-1 text-left",
        className,
      )}
      {...props}
    >
      {children}
    </DialogHeader>
  );
}

export const DashboardDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn(dashboardDialogText.title, className)}
    {...props}
  />
));
DashboardDialogTitle.displayName = "DashboardDialogTitle";

export const DashboardDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => (
  <DialogDescription
    ref={ref}
    className={cn(dashboardDialogText.description, className)}
    {...props}
  />
));
DashboardDialogDescription.displayName = "DashboardDialogDescription";

export function DashboardDialogBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        dashboardSurfaces.dialogBody,
        "min-h-0 flex-1 overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DashboardDialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <DialogFooter
      className={cn(
        dashboardSurfaces.dialogFooter,
        "shrink-0 bg-white dark:bg-neutral-900",
        className,
      )}
      {...props}
    >
      {children}
    </DialogFooter>
  );
}
