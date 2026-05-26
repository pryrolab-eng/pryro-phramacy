"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";

type Props = {
  featureKey?: string;
  title?: string;
  compact?: boolean;
};

export function UpgradePrompt({
  featureKey,
  title,
  compact,
}: Props) {
  const { featureLabel } = usePharmacyEntitlements();
  const resolvedTitle =
    title ??
    (featureKey ? `Upgrade to use ${featureLabel(featureKey)}` : "Upgrade required");
  const href = featureKey
    ? `/pharmacy-dashboard/billing?upgrade=${encodeURIComponent(featureKey)}`
    : "/pharmacy-dashboard/billing";

  if (compact) {
    return (
      <Link
        href={href}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Lock className="h-3 w-3" />
        Upgrade
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
      <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
      <p className="font-medium">{resolvedTitle}</p>
      <p className="text-sm text-muted-foreground">
        This capability is not included in your current plan.
      </p>
      <Button asChild size="sm">
        <Link href={href}>View plans</Link>
      </Button>
    </div>
  );
}
