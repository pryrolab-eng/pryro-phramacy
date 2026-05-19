"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export type AdminFeedbackVariant = "success" | "error" | "warning";

type AdminFeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  variant?: AdminFeedbackVariant;
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
} as const;

const iconClass = {
  success: "text-green-600",
  error: "text-destructive",
  warning: "text-amber-600",
} as const;

export function AdminFeedbackDialog({
  open,
  onOpenChange,
  title,
  message,
  variant = "success",
}: AdminFeedbackDialogProps) {
  const Icon = icons[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <Icon className={`h-6 w-6 shrink-0 mt-0.5 ${iconClass[variant]}`} />
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="text-sm text-foreground/80 whitespace-pre-wrap">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
