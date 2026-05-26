"use client";

import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { shouldHideLockedFeature } from "@/lib/subscription/nav-entitlement-display";
import { UpgradePrompt } from "./upgrade-prompt";

type Props = {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** When true, hide entirely if locked (matches nav hide mode). */
  hideWhenLocked?: boolean;
  compact?: boolean;
};

export function FeatureGate({
  featureKey,
  children,
  fallback,
  hideWhenLocked,
  compact,
}: Props) {
  const { can, isPending, featureLabel } = usePharmacyEntitlements();

  if (isPending) return null;
  if (can(featureKey)) return <>{children}</>;

  if (hideWhenLocked ?? shouldHideLockedFeature(featureKey, can)) {
    return null;
  }

  return (
    <>
      {fallback ?? (
        <UpgradePrompt
          featureKey={featureKey}
          title={`Upgrade to use ${featureLabel(featureKey)}`}
          compact={compact}
        />
      )}
    </>
  );
}
