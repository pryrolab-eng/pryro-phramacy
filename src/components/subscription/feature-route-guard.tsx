"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { ALWAYS_ALLOWED_ROUTES } from "@/lib/subscription/feature-catalog";

type Props = {
  children: React.ReactNode;
};

export function FeatureRouteGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { entitlements, can, isPending } = usePharmacyEntitlements();

  useEffect(() => {
    if (isPending || !entitlements.isAccessAllowed) return;

    const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
    if (
      ALWAYS_ALLOWED_ROUTES.some(
        (r) => normalized === r || normalized.startsWith(`${r}/`),
      )
    ) {
      return;
    }

    const entries = Object.entries(entitlements.routeFeatureMap).sort(
      (a, b) => b[0].length - a[0].length,
    );
    for (const [route, featureKey] of entries) {
      const r = route.replace(/\/$/, "") || "/";
      if (normalized === r || normalized.startsWith(`${r}/`)) {
        if (!can(featureKey)) {
          router.replace(
            `/pharmacy-dashboard/billing?upgrade=${encodeURIComponent(featureKey)}`,
          );
        }
        return;
      }
    }
  }, [pathname, entitlements, can, isPending, router]);

  return <>{children}</>;
}
