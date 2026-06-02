"use client";

import { useCallback, useMemo } from "react";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useAccessBlockMessaging } from "@/hooks/useAccessBlockMessaging";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { isRouteAllowedWhenAccessBlocked } from "@/lib/subscription/subscription-grace-routes";

/**
 * Whether sidebar / account menu links are allowed while pharmacy access is blocked.
 */
export function useDashboardGraceNav() {
  const { context } = useActivePharmacy();
  const { entitlements, isEntitlementsReady } = usePharmacyEntitlements();
  const { messaging } = useAccessBlockMessaging();

  const isBlocked = isEntitlementsReady && !entitlements.isAccessAllowed;
  const reason = entitlements.accessBlockReason ?? "subscription_expired";

  const canReachHref = useCallback(
    (href: string) => {
      if (!isBlocked) return true;
      const pathname = href.split("?")[0];
      return isRouteAllowedWhenAccessBlocked(pathname, context.role, reason);
    },
    [isBlocked, context.role, reason],
  );

  return useMemo(
    () => ({
      isBlocked,
      canReachHref,
      /** Password changes are tied to settings; blocked with other dashboard actions. */
      canChangePassword: !isBlocked,
      lockedHint: messaging.shortLabel,
    }),
    [isBlocked, canReachHref, messaging.shortLabel],
  );
}
