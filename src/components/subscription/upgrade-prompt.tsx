"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { DashboardButton, DashboardFeatureLock } from "@/components/dashboard";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { UpgradePlanDialog } from "@/components/subscription/upgrade-plan-dialog";

type Props = {
  featureKey?: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

export function UpgradePrompt({
  featureKey,
  title,
  description,
  compact,
}: Props) {
  const [open, setOpen] = useState(false);
  const { featureLabel } = usePharmacyEntitlements();
  const label = featureKey ? featureLabel(featureKey) : undefined;
  const resolvedTitle =
    title ??
    (label ? `Upgrade to use ${label}` : "Upgrade required");

  if (compact) {
    return (
      <>
        <DashboardButton
          type="button"
          tone="ghost"
          className="h-7 gap-1.5 px-2 text-xs text-neutral-500"
          onClick={() => setOpen(true)}
        >
          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
          Upgrade
        </DashboardButton>
        <UpgradePlanDialog
          open={open}
          onOpenChange={setOpen}
          featureLabel={label}
        />
      </>
    );
  }

  return (
    <>
      <DashboardFeatureLock
        title={resolvedTitle}
        description={description}
        onAction={() => setOpen(true)}
      />
      <UpgradePlanDialog
        open={open}
        onOpenChange={setOpen}
        featureLabel={label}
      />
    </>
  );
}
