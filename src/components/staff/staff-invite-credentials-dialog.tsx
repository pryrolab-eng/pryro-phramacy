"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
  DashboardButton,
} from "@/components/dashboard";
import type { StaffInviteCredentials } from "@/lib/http/pharmacist";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: StaffInviteCredentials | null;
  emailError?: string;
  memberName?: string;
};

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
}

function CopyField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(label, value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} readOnly value={value} className="font-mono text-sm" />
        <DashboardButton
          type="button"
          tone="outline"
          size="icon"
          aria-label={`Copy ${label}`}
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <Check className="size-4 text-emerald-600" />
          ) : (
            <Copy className="size-4" />
          )}
        </DashboardButton>
      </div>
    </div>
  );
}

export function StaffInviteCredentialsDialog({
  open,
  onOpenChange,
  credentials,
  emailError,
  memberName,
}: Props) {
  if (!credentials) return null;

  const copyAll = async () => {
    const block = [
      `Sign in: ${credentials.signInUrl}`,
      `Email: ${credentials.email}`,
      `Temporary password: ${credentials.temporaryPassword}`,
    ].join("\n");
    await copyText("Login details", block);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardDialogContent className="sm:max-w-md">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Share login details manually</DashboardDialogTitle>
          <DashboardDialogDescription>
            {memberName ? (
              <>
                <span className="font-medium text-foreground">{memberName}</span>{" "}
                was added, but the invitation email could not be sent. Copy these
                details and send them through a channel you trust (SMS, in
                person, etc.). They should change their password after first
                sign-in.
              </>
            ) : (
              <>
                The account was created, but the invitation email could not be
                sent. Copy these details and share them securely with the new
                team member.
              </>
            )}
          </DashboardDialogDescription>
        </DashboardDialogHeader>
        <DashboardDialogBody className="grid gap-4">
          {emailError ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              {emailError}
            </p>
          ) : null}
          <CopyField id="staff-sign-in" label="Sign-in URL" value={credentials.signInUrl} />
          <CopyField id="staff-email" label="Email" value={credentials.email} />
          <CopyField
            id="staff-password"
            label="Temporary password"
            value={credentials.temporaryPassword}
          />
        </DashboardDialogBody>
        <DashboardDialogActions
          cancelLabel="Close"
          confirmLabel="Copy all"
          onCancel={() => onOpenChange(false)}
          onConfirm={() => void copyAll()}
        />
      </DashboardDialogContent>
    </Dialog>
  );
}
