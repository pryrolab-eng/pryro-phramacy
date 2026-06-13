"use client";

import { useCallback, useMemo } from "react";
import { useOptionalActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useAccessBlockMessaging } from "@/hooks/useAccessBlockMessaging";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { isRouteAllowedWhenAccessBlocked } from "@/lib/subscription/subscription-grace-routes";

const ADMIN_GRACE_NAV = {
  isBlocked: false,
  canReachHref: () => true,
  canChangePassword: true,
  lockedHint: "",
} as const;

/**
 * Whether sidebar / account menu links are allowed while pharmacy access is blocked.
 * On platform admin routes (no pharmacy context), grace blocking does not apply.
 */
export function useDashboardGraceNav() {
  const pharmacyCtx = useOptionalActivePharmacy();
  const hasPharmacyContext = pharmacyCtx !== null;

  const { entitlements, isEntitlementsReady } = usePharmacyEntitlements({
    enabled: hasPharmacyContext,
  });
  const { messaging } = useAccessBlockMessaging({
    enabled: hasPharmacyContext,
  });

  const role = pharmacyCtx?.context.role ?? null;
  const isBlocked =
    hasPharmacyContext && isEntitlementsReady && !entitlements.isAccessAllowed;
  const reason = entitlements.accessBlockReason ?? "subscription_expired";

  const canReachHref = useCallback(
    (href: string) => {
      if (!hasPharmacyContext || !isBlocked) return true;
      const pathname = href.split("?")[0];
      return isRouteAllowedWhenAccessBlocked(pathname, role, reason);
    },
    [hasPharmacyContext, isBlocked, role, reason],
  );

  return useMemo(() => {
    if (!hasPharmacyContext) {
      return ADMIN_GRACE_NAV;
    }
    return {
      isBlocked,
      canReachHref,
      /** Password changes are tied to settings; blocked with other dashboard actions. */
      canChangePassword: !isBlocked,
      lockedHint: messaging.shortLabel,
    };
  }, [
    hasPharmacyContext,
    isBlocked,
    canReachHref,
    messaging.shortLabel,
  ]);
}
