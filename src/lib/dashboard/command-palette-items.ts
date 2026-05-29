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
import { canReachRouteWhenSubscriptionInactive } from "@/lib/subscription/subscription-grace-routes";

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

const BILLING_HREF = "/pharmacy-dashboard/billing";

const QUICK_ACTIONS_OWNER: Omit<CommandPaletteItem, "group" | "locked">[] = [
  {
    id: "action-pos",
    label: "New sale",
    href: "/pos",
    icon: ShoppingCart,
    featureKey: "pos.access",
    keywords: "checkout sell",
  },
  {
    id: "action-inventory",
    label: "Add stock",
    href: "/inventory",
    icon: Plus,
    featureKey: "inventory.access",
    keywords: "inventory drug product",
  },
];

const QUICK_ACTIONS_PHARMACIST: Omit<CommandPaletteItem, "group" | "locked">[] = [
  {
    id: "action-pos",
    label: "Open POS",
    href: "/pos",
    icon: ShoppingCart,
    featureKey: "pos.access",
    keywords: "checkout sell",
  },
  {
    id: "action-inventory",
    label: "Add drug",
    href: "/inventory",
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
): boolean {
  if (canReachRouteWhenSubscriptionInactive(href)) return true;
  if (!subscriptionActive) return false;
  return href.startsWith("/settings");
}

export function getNavItemsForRole(role: string | null | undefined): NavItemConfig[] {
  if (role === "pharmacist") return PHARMACIST_NAV_ITEMS;
  if (isCashierLikeRole(role)) return CASHIER_NAV_ITEMS;
  return PHARMACY_NAV_ITEMS;
}

export type BuildCommandPaletteOptions = {
  isAccessAllowed?: boolean;
  isEntitlementsReady?: boolean;
};

function resolveItemAccess(
  item: CommandPaletteItem,
  can: (featureKey: string) => boolean,
  subscriptionActive: boolean,
): CommandPaletteItem {
  if (item.action || !item.href) {
    return item;
  }

  if (isAlwaysReachable(item.href, subscriptionActive)) {
    return { ...item, locked: false };
  }

  const featureOk = !item.featureKey || can(item.featureKey);
  const allowed = subscriptionActive && featureOk;

  if (allowed) {
    return { ...item, locked: false };
  }

  return {
    ...item,
    locked: true,
    href: subscriptionActive ? item.href : BILLING_HREF,
    lockHint: subscriptionActive
      ? "Upgrade your plan to unlock"
      : "Renew subscription to unlock",
  };
}

export function buildCommandPaletteItems(
  role: string | null | undefined,
  can: (featureKey: string) => boolean,
  options?: BuildCommandPaletteOptions,
): CommandPaletteItem[] {
  const subscriptionActive = options?.isAccessAllowed !== false;
  const ready = options?.isEntitlementsReady !== false;

  const nav = navToCommands(getNavItemsForRole(role)).map((item) =>
    resolveItemAccess(item, can, subscriptionActive),
  );

  const quickSource =
    role === "pharmacist"
      ? QUICK_ACTIONS_PHARMACIST
      : isCashierLikeRole(role)
        ? QUICK_ACTIONS_OWNER.filter((a) => a.id === "action-pos")
        : QUICK_ACTIONS_OWNER;

  const actions = quickToCommands(quickSource).map((item) =>
    resolveItemAccess(item, can, subscriptionActive),
  );

  const navUrls = new Set(nav.map((n) => n.href));
  const dedupedActions = actions.filter((a) => !a.href || !navUrls.has(a.href));

  const shortcuts = [
    SIDEBAR_TOGGLE,
    ...(ready && !subscriptionActive ? EXPIRED_SHORTCUTS : []),
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
    keywords: item.url.replace(/\//g, " "),
  }));

  return [SIDEBAR_TOGGLE, ...navigation];
}
