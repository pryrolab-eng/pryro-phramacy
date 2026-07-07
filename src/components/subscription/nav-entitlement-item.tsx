"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";
import { lockedNavTooltip } from "@/components/sidebar/dashboard-sidebar-upgrade";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "@/lib/subscription/nav-config";
import { getNavEntitlementDisplayMode } from "@/lib/subscription/nav-entitlement-display";
import { UpgradePlanDialog } from "@/components/subscription/upgrade-plan-dialog";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";

import { NavMenuShortcut } from "@/components/sidebar/nav-menu-shortcut";
import { canAccessBillingWhenBlocked } from "@/lib/subscription/access-block";
import { BILLING_ROUTE } from "@/lib/subscription/subscription-grace-routes";

const BILLING_HREF = BILLING_ROUTE;

type Props = {
  item: NavItemConfig;
  pathname: string;
  allowed: boolean;
  isAccessAllowed: boolean;
};

export function NavEntitlementItem({
  item,
  pathname,
  allowed,
  isAccessAllowed,
}: Props) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { featureLabel, isHydrating, entitlements } = usePharmacyEntitlements();
  const isActive = pathname === item.url;
  const isBilling = item.url.includes("/billing");
  const blockReason = entitlements.accessBlockReason ?? "subscription_expired";
  const billingWhenBlocked = canAccessBillingWhenBlocked(blockReason);

  if (isHydrating) {
    return null;
  }

  if (allowed || (isBilling && !isAccessAllowed && billingWhenBlocked)) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
          className={cn(
            dashboardSidebarTokens.navItem,
            dashboardSidebarTokens.navActive,
          )}
        >
          <Link
            href={item.url}
            className="flex w-full min-w-0 items-center gap-2 data-[active=true]:[&_[data-shortcut-kbd]]:border-white/25 data-[active=true]:[&_[data-shortcut-kbd]]:bg-white/15 data-[active=true]:[&_[data-shortcut-kbd]]:text-white/80 data-[active=true]:[&_[data-shortcut-kbd]]:shadow-none"
          >
            <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            {item.shortcutKeys?.length ? (
              <NavMenuShortcut
                keys={item.shortcutKeys}
                className={dashboardSidebarTokens.collapsedHidden}
              />
            ) : null}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (!isAccessAllowed) {
    const lockHint = billingWhenBlocked
      ? `${item.title} — renew to unlock`
      : `${item.title} — unavailable`;

    const lockedButton = (
      <SidebarMenuButton
        asChild={billingWhenBlocked}
        isActive={isActive}
        tooltip={lockedNavTooltip(lockHint)}
        className={cn(dashboardSidebarTokens.navLocked, "opacity-90")}
        disabled={!billingWhenBlocked}
      >
        {billingWhenBlocked ? (
          <Link href={BILLING_HREF}>
            <item.icon className="size-4 shrink-0 opacity-60" strokeWidth={1.75} />
            <span>{item.title}</span>
            <Lock
              className={cn(
                "ml-auto size-3 shrink-0 text-neutral-400",
                dashboardSidebarTokens.collapsedHidden,
              )}
            />
          </Link>
        ) : (
          <>
            <item.icon className="size-4 shrink-0 opacity-60" strokeWidth={1.75} />
            <span>{item.title}</span>
            <Lock
              className={cn(
                "ml-auto size-3 shrink-0 text-neutral-400",
                dashboardSidebarTokens.collapsedHidden,
              )}
            />
          </>
        )}
      </SidebarMenuButton>
    );

    return <SidebarMenuItem>{lockedButton}</SidebarMenuItem>;
  }

  if (getNavEntitlementDisplayMode() === "hide") {
    return null;
  }

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={lockedNavTooltip(`${item.title} — upgrade to unlock`)}
          className={cn(dashboardSidebarTokens.navLocked, "cursor-pointer")}
          onClick={() => setUpgradeOpen(true)}
        >
          <item.icon className="size-4 shrink-0 opacity-50" strokeWidth={1.75} />
          <span className="opacity-80">{item.title}</span>
          <Lock
            className={cn(
              "ml-auto size-3 shrink-0 text-neutral-400",
              dashboardSidebarTokens.collapsedHidden,
            )}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
      <UpgradePlanDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel={featureLabel(item.featureKey)}
      />
    </>
  );
}
