"use client";

import { Sparkles } from "lucide-react";
import {
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
} from "@/components/dashboard";
import { SubscriptionPlanManagement } from "@/components/subscription/subscription-plan-management";
import type { PaidCheckoutContext } from "@/lib/subscription/checkout-client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
  checkoutReturnContext?: PaidCheckoutContext;
  onPlanChanged?: () => void;
};

export function UpgradePlanDialog({
  open,
  onOpenChange,
  featureLabel,
  checkoutReturnContext = "billing",
  onPlanChanged,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardDialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DashboardDialogHeader className="border-b border-border/60 px-6 py-5 text-center sm:text-center">
          <DashboardDialogTitle>Upgrade plan</DashboardDialogTitle>
          <DashboardDialogDescription className="mx-auto max-w-lg">
            {featureLabel ? (
              <span className="inline-flex flex-wrap items-center justify-center gap-2">
                <span>Choose a plan that unlocks</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500 bg-amber-500/5 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                  {featureLabel}
                </span>
              </span>
            ) : (
              "Compare plans and pick the best fit for your pharmacy."
            )}
          </DashboardDialogDescription>
        </DashboardDialogHeader>
        <DashboardDialogBody className="max-h-none flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <SubscriptionPlanManagement
            checkoutReturnContext={checkoutReturnContext}
            showBranchAddons={false}
            layout="dialog"
            onPlanChanged={onPlanChanged}
          />
        </DashboardDialogBody>
      </DashboardDialogContent>
    </Dialog>
  );
}
