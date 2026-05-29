"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardFeatureLock } from "@/components/dashboard";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { ALWAYS_ALLOWED_ROUTES } from "@/lib/subscription/feature-catalog";
import { UpgradePlanDialog } from "@/components/subscription/upgrade-plan-dialog";

type Props = {
  children: React.ReactNode;
};

export function FeatureRouteGuard({ children }: Props) {
  const pathname = usePathname();
  const { entitlements, can, featureLabel, isHydrating } =
    usePharmacyEntitlements();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const blockedFeatureKey = useMemo(() => {
    if (isHydrating || !entitlements.isAccessAllowed) return null;

    const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
    if (
      ALWAYS_ALLOWED_ROUTES.some(
        (r) => normalized === r || normalized.startsWith(`${r}/`),
      )
    ) {
      return null;
    }

    const entries = Object.entries(entitlements.routeFeatureMap).sort(
      (a, b) => b[0].length - a[0].length,
    );
    for (const [route, featureKey] of entries) {
      const r = route.replace(/\/$/, "") || "/";
      if (normalized === r || normalized.startsWith(`${r}/`)) {
        if (!can(featureKey)) {
          return featureKey;
        }
        return null;
      }
    }
    return null;
  }, [pathname, entitlements, can, isHydrating]);

  useEffect(() => {
    if (blockedFeatureKey) {
      setIsUpgradeOpen(true);
    }
  }, [blockedFeatureKey]);

  if (blockedFeatureKey) {
    const label = featureLabel(blockedFeatureKey);

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md">
          <DashboardFeatureLock
            title="Upgrade required"
            description={`Your current plan does not include ${label}.`}
            onAction={() => setIsUpgradeOpen(true)}
            minHeight={false}
          />
        </div>
        <UpgradePlanDialog
          open={isUpgradeOpen}
          onOpenChange={setIsUpgradeOpen}
          featureLabel={label}
        />
      </div>
    );
  }

  return <>{children}</>;
}
