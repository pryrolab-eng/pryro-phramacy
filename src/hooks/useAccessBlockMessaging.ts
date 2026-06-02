"use client";

import { useMemo } from "react";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import {
  canAccessBillingWhenBlocked,
  getAccessBlockMessaging,
  type PharmacyAccessBlockReason,
} from "@/lib/subscription/access-block";
import { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";

export function useAccessBlockMessaging() {
  const { context } = useActivePharmacy();
  const { entitlements, isEntitlementsReady } = usePharmacyEntitlements();
  const isOwner = isPharmacyOwnerRole(context.role);
  const reason: PharmacyAccessBlockReason =
    entitlements.accessBlockReason ?? "subscription_expired";

  const messaging = useMemo(
    () => getAccessBlockMessaging(reason, isOwner),
    [reason, isOwner],
  );

  const isBlocked =
    isEntitlementsReady && !entitlements.isAccessAllowed;

  return {
    reason,
    messaging,
    isBlocked,
    isOwner,
    canAccessBilling: canAccessBillingWhenBlocked(reason),
  };
}
