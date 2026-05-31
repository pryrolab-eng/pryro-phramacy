"use client";

import { useQuery } from "@tanstack/react-query";
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
import { getMeContext, meContextKeys } from "@/lib/http/me-context";

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks the dashboard until invited staff set a permanent password.
 */
export function MustChangePasswordGate({ children }: Props) {
  const { data, isPending, isError } = useQuery({
    queryKey: meContextKeys.all,
    queryFn: getMeContext,
    staleTime: 15_000,
  });

  const mustChange = data?.mustChangePassword === true;

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your account…</p>
      </div>
    );
  }

  if (mustChange) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
        <Dialog open onOpenChange={() => {}}>
          <DashboardDialogContent
            className="sm:max-w-md"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DashboardDialogHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="size-5" />
              </div>
              <DashboardDialogTitle>Set your password</DashboardDialogTitle>
              <DashboardDialogDescription>
                For security, you must replace your temporary login password
                before using Pryrox.
              </DashboardDialogDescription>
            </DashboardDialogHeader>
            <DashboardDialogBody>
              <ChangePasswordForm forced submitLabel="Continue to dashboard" />
            </DashboardDialogBody>
          </DashboardDialogContent>
        </Dialog>
      </div>
    );
  }

  return <>{children}</>;
}
