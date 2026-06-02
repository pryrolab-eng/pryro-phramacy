import type { LucideIcon } from "lucide-react";
import {
  CASHIER_NAV_ITEMS,
  isCashierLikeRole,
  PHARMACIST_NAV_ITEMS,
  PHARMACY_NAV_ITEMS,
  type NavItemConfig,
} from "@/lib/subscription/nav-config";
import { CreditCard, Package, PanelLeft, Plus, ShoppingCart } from "lucide-react";
import { ADMIN_SIDEBAR_NAV } from "@/lib/admin/navigation";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import type { PharmacyAccessBlockReason } from "@/lib/subscription/access-block";
import { canReachRouteWhenAccessBlocked } from "@/lib/subscription/subscription-grace-routes";

export type CommandPaletteGroup = "navigation" | "actions" | "shortcuts";

export type CommandPaletteAction = "toggle-sidebar";

export type CommandPaletteItem = {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  group: CommandPaletteGroup;
  featureKey?: string;
  keywords?: string;
  locked?: boolean;
  lockHint?: string;
  action?: CommandPaletteAction;
  /** Shown in palette row — discoverability without persistent chrome labels. */
  shortcutKeys?: string[];
};

const BILLING_HREF = PHARMACY_ROUTES.billing;

const QUICK_ACTIONS_OWNER: Omit<CommandPaletteItem, "group" | "locked">[] = [
  {
    id: "action-pos",
    label: "New sale",
    href: PHARMACY_ROUTES.pos,
    icon: ShoppingCart,
    featureKey: "pos.access",
    keywords: "checkout sell",
  },
  {
    id: "action-inventory",
    label: "Add stock",
    href: PHARMACY_ROUTES.inventory,
    icon: Plus,
    featureKey: "inventory.access",
    keywords: "inventory drug product",
  },
];

const QUICK_ACTIONS_PHARMACIST: Omit<CommandPaletteItem, "group" | "locked">[] = [
  {
    id: "action-pos",
    label: "Open POS",
    href: PHARMACY_ROUTES.pos,
    icon: ShoppingCart,
    featureKey: "pos.access",
    keywords: "checkout sell",
  },
  {
    id: "action-inventory",
    label: "Add drug",
    href: PHARMACY_ROUTES.inventory,
    icon: Package,
    featureKey: "inventory.access",
    keywords: "inventory stock",
  },
];

const SIDEBAR_TOGGLE: CommandPaletteItem = {
  id: "shortcut-sidebar",
  label: "Toggle sidebar",
  icon: PanelLeft,
  group: "shortcuts",
  action: "toggle-sidebar",
  shortcutKeys: ["Ctrl", "B"],
  keywords: "collapse expand panel navigation sidebar hide show",
};

const EXPIRED_SHORTCUTS: CommandPaletteItem[] = [
  {
    id: "shortcut-billing",
    label: "Renew or change plan",
    href: BILLING_HREF,
    icon: CreditCard,
    group: "shortcuts",
    keywords: "subscribe upgrade billing payment",
  },
];

function navToCommands(items: NavItemConfig[]): CommandPaletteItem[] {
  return items.map((item) => ({
    id: `nav-${item.url}`,
    label: item.title,
    href: item.url,
    icon: item.icon,
    group: "navigation" as const,
    featureKey: item.featureKey,
    keywords: item.url.replace(/\//g, " "),
  }));
}

function quickToCommands(
  items: Omit<CommandPaletteItem, "group" | "locked">[],
): CommandPaletteItem[] {
  return items.map((item) => ({ ...item, group: "actions" as const }));
}

function isAlwaysReachable(
  href: string,
  subscriptionActive: boolean,
  accessBlockReason: PharmacyAccessBlockReason,
): boolean {
  if (canReachRouteWhenAccessBlocked(href, accessBlockReason)) return true;
  if (!subscriptionActive) return false;
  return href.startsWith(PHARMACY_ROUTES.settings);
}

export function getNavItemsForRole(role: string | null | undefined): NavItemConfig[] {
  if (role === "pharmacist") return PHARMACIST_NAV_ITEMS;
  if (isCashierLikeRole(role)) return CASHIER_NAV_ITEMS;
  return PHARMACY_NAV_ITEMS;
}

export type BuildCommandPaletteOptions = {
  isAccessAllowed?: boolean;
  isEntitlementsReady?: boolean;
  accessBlockReason?: PharmacyAccessBlockReason;
};

function resolveItemAccess(
  item: CommandPaletteItem,
  can: (featureKey: string) => boolean,
  subscriptionActive: boolean,
  accessBlockReason: PharmacyAccessBlockReason,
): CommandPaletteItem {
  if (item.action || !item.href) {
    return item;
  }

  if (isAlwaysReachable(item.href, subscriptionActive, accessBlockReason)) {
    return { ...item, locked: false };
  }

  const featureOk = !item.featureKey || can(item.featureKey);
  const allowed = subscriptionActive && featureOk;

  if (allowed) {
    return { ...item, locked: false };
  }

  const billingReachable = canReachRouteWhenAccessBlocked(
    BILLING_HREF,
    accessBlockReason,
  );

  return {
    ...item,
    locked: true,
    href:
      subscriptionActive || !billingReachable ? item.href : BILLING_HREF,
    lockHint: subscriptionActive
      ? "Upgrade your plan to unlock"
      : billingReachable
        ? "Renew subscription to unlock"
        : "Unavailable while access is blocked",
  };
}

export function buildCommandPaletteItems(
  role: string | null | undefined,
  can: (featureKey: string) => boolean,
  options?: BuildCommandPaletteOptions,
): CommandPaletteItem[] {
  const subscriptionActive = options?.isAccessAllowed !== false;
  const ready = options?.isEntitlementsReady !== false;
  const accessBlockReason =
    options?.accessBlockReason ??
    (subscriptionActive ? "none" : "subscription_expired");

  const nav = navToCommands(getNavItemsForRole(role)).map((item) =>
    resolveItemAccess(item, can, subscriptionActive, accessBlockReason),
  );

  const quickSource =
    role === "pharmacist"
      ? QUICK_ACTIONS_PHARMACIST
      : isCashierLikeRole(role)
        ? QUICK_ACTIONS_OWNER.filter((a) => a.id === "action-pos")
        : QUICK_ACTIONS_OWNER;

  const actions = quickToCommands(quickSource).map((item) =>
    resolveItemAccess(item, can, subscriptionActive, accessBlockReason),
  );

  const navUrls = new Set(nav.map((n) => n.href));
  const dedupedActions = actions.filter((a) => !a.href || !navUrls.has(a.href));

  const shortcuts = [
    SIDEBAR_TOGGLE,
    ...(ready &&
    !subscriptionActive &&
    canReachRouteWhenAccessBlocked(BILLING_HREF, accessBlockReason)
      ? EXPIRED_SHORTCUTS
      : []),
  ];

  return [...shortcuts, ...dedupedActions, ...nav];
}

export function groupCommandPaletteItems(items: CommandPaletteItem[]) {
  return {
    shortcuts: items.filter((i) => i.group === "shortcuts"),
    actions: items.filter((i) => i.group === "actions"),
    navigation: items.filter((i) => i.group === "navigation"),
  };
}

export function buildAdminCommandPaletteItems(): CommandPaletteItem[] {
  const navigation = ADMIN_SIDEBAR_NAV.map((item) => ({
    id: `admin-nav-${item.url}`,
    label: item.title,
    href: item.url,
    icon: item.icon,
    group: "navigation" as const,
    keywords: [item.url.replace(/\//g, " "), item.keywords].filter(Boolean).join(" "),
  }));

  return [SIDEBAR_TOGGLE, ...navigation];
}
