"use client";

import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { shouldHideLockedFeature } from "@/lib/subscription/nav-entitlement-display";
import { SubscriptionInactiveFallback } from "@/components/dashboard/subscription-welcome-home";
import { UpgradePrompt } from "./upgrade-prompt";

type Props = {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Shown while entitlements load (default: null). */
  loadingFallback?: React.ReactNode;
  /** When true, hide entirely if locked (matches nav hide mode). */
  hideWhenLocked?: boolean;
  compact?: boolean;
};

export function FeatureGate({
  featureKey,
  children,
  fallback,
  loadingFallback,
  hideWhenLocked,
  compact,
}: Props) {
  const { can, entitlements, isHydrating, isEntitlementsReady, featureLabel } =
    usePharmacyEntitlements();

  if (isHydrating) return <>{loadingFallback ?? null}</>;
  if (!isEntitlementsReady) return <>{loadingFallback ?? null}</>;
  if (can(featureKey)) return <>{children}</>;

  if (!entitlements.isAccessAllowed) {
    return (
      <SubscriptionInactiveFallback featureLabel={featureLabel(featureKey)} />
    );
  }

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
