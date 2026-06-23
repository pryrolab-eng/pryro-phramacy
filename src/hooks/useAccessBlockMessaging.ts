"use client";

import { useMemo } from "react";
import { useOptionalActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import {
  canAccessBillingWhenBlocked,
  getAccessBlockMessaging,
  type PharmacyAccessBlockReason,
} from "@/lib/subscription/access-block";
import { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";

export function useAccessBlockMessaging(options?: { enabled?: boolean }) {
  const pharmacyCtx = useOptionalActivePharmacy();
  const enabled = (options?.enabled ?? true) && pharmacyCtx !== null;

  const { entitlements, isEntitlementsReady } = usePharmacyEntitlements({
    enabled,
  });

  const role = pharmacyCtx?.context.role ?? null;
  const isOwner = isPharmacyOwnerRole(role);
  const reason: PharmacyAccessBlockReason =
    entitlements.accessBlockReason ?? "subscription_expired";

  const messaging = useMemo(
    () => getAccessBlockMessaging(reason, isOwner),
    [reason, isOwner],
  );

  const isBlocked = enabled && isEntitlementsReady && !entitlements.isAccessAllowed;

  return {
    reason,
    messaging,
    isBlocked,
    isOwner,
    canAccessBilling: canAccessBillingWhenBlocked(reason),
  };
}
