"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import {
  isRouteAllowedWhenAccessBlocked,
  normalizeRoutePath,
  resolveSubscriptionHomePath,
} from "@/lib/subscription/subscription-grace-routes";

interface SubscriptionBlockerProps {
  userRole: string;
}

/**
 * When access is blocked, keep role home open and billing only when payment can help.
 */
export default function SubscriptionBlocker({
  userRole,
}: SubscriptionBlockerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { entitlements, isEntitlementsReady } = usePharmacyEntitlements();

  useEffect(() => {
    const normalized = normalizeRoutePath(pathname);
    if (
      normalized === "/admin" ||
      normalized.startsWith("/admin/") ||
      normalized === "/superadmin" ||
      normalized.startsWith("/superadmin/")
    ) {
      return;
    }

    if (!isEntitlementsReady) return;
    if (entitlements.isAccessAllowed) return;

    const reason = entitlements.accessBlockReason ?? "subscription_expired";
    if (isRouteAllowedWhenAccessBlocked(pathname, userRole, reason)) return;

    router.replace(resolveSubscriptionHomePath(userRole));
  }, [
    entitlements.accessBlockReason,
    entitlements.isAccessAllowed,
    isEntitlementsReady,
    pathname,
    router,
    userRole,
  ]);

  return null;
}
