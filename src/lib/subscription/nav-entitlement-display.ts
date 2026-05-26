export type NavEntitlementDisplayMode = "hide" | "lock";

/** Locked nav items: hidden (default) or shown with lock + upgrade CTA. */
export function getNavEntitlementDisplayMode(): NavEntitlementDisplayMode {
  const raw = process.env.NEXT_PUBLIC_NAV_ENTITLEMENT_MODE?.toLowerCase();
  if (raw === "lock") return "lock";
  return "hide";
}

export function shouldHideLockedFeature(
  featureKey: string,
  can: (key: string) => boolean,
): boolean {
  if (can(featureKey)) return false;
  return getNavEntitlementDisplayMode() === "hide";
}
