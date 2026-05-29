"use client";

import { usePathname } from "next/navigation";
import { Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { DashboardSidebarRail } from "@/components/sidebar/dashboard-sidebar-rail";
import { DashboardSidebarBrand } from "@/components/sidebar/dashboard-sidebar-brand";
import { DashboardSidebarUpgrade, DashboardSidebarPlanCollapsed } from "@/components/sidebar/dashboard-sidebar-upgrade";
import { DashboardSidebarStaffInactive } from "@/components/sidebar/dashboard-sidebar-staff-inactive";
import { SidebarNavSkeleton } from "@/components/sidebar/sidebar-nav-skeleton";
import { SidebarUserAccountMenu } from "@/components/sidebar-user-account-menu";
import { useSidebarUserName } from "@/components/sidebar/use-sidebar-user-name";
import { NavEntitlementItem } from "@/components/subscription/nav-entitlement-item";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { usePharmacyBrandingOptional } from "@/components/pharmacy/pharmacy-branding-provider";
import type { NavItemConfig } from "@/lib/subscription/nav-config";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";
import { cn } from "@/lib/utils";

export type DashboardRoleSidebarConfig = {
  brandHref: string;
  brandIcon: LucideIcon;
  brandSubtitle: string;
  groupLabel: string;
  roleLabel: string;
  userNameFallback: string;
  navItems: NavItemConfig[];
  showUpgradeCard?: boolean;
  avatarClassName?: string;
};

export function DashboardRoleSidebar({
  config,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  config: DashboardRoleSidebarConfig;
}) {
  const {
    brandHref,
    brandIcon,
    brandSubtitle,
    groupLabel,
    roleLabel,
    userNameFallback,
    navItems,
    showUpgradeCard = false,
    avatarClassName,
  } = config;

  const pathname = usePathname();
  const userName = useSidebarUserName(userNameFallback);
  const { can, entitlements, isHydrating, isEntitlementsReady } =
    usePharmacyEntitlements();
  const { pharmacyName, branding } = usePharmacyBrandingOptional();

  const subscriptionInactive =
    isEntitlementsReady && !entitlements.isAccessAllowed;

  const showSplit = isEntitlementsReady && entitlements.isAccessAllowed;
  const unlockedItems = showSplit
    ? navItems.filter((item) => can(item.featureKey))
    : navItems;
  const lockedItems = showSplit
    ? navItems.filter((item) => !can(item.featureKey))
    : [];

  const showNavSkeleton = isHydrating;
  const { usage, limits } = entitlements;
  const showPlanFooter = showUpgradeCard || subscriptionInactive;
  const planSummaryProps = {
    planLabel:
      entitlements.effectivePlan?.name ??
      entitlements.effectivePlanLabel ??
      "trial",
    daysLeft: entitlements.daysRemaining,
    isExpired:
      isEntitlementsReady &&
      (entitlements.isExpired || !entitlements.isAccessAllowed),
    staffUsed: usage.activeUsers,
    staffLimit: limits.maxUsers,
    branchesUsed: usage.activeBranches,
    branchesLimit: limits.totalBranchSlots,
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950/50"
      {...props}
    >
      <DashboardSidebarBrand
        href={brandHref}
        icon={brandIcon}
        title={pharmacyName}
        subtitle={brandSubtitle}
        logoUrl={branding.logoUrl}
        primaryColor={branding.primaryColor}
        hideSubtitleWhenSameAsTitle
      />

      <SidebarContent
        className={cn(
          "min-h-0 flex-1 gap-1 px-1 py-2",
          dashboardSidebarTokens.sidebarScroll,
        )}
      >
        <SidebarGroup className="p-1">
          <SidebarGroupLabel className={dashboardSidebarTokens.groupLabel}>
            {groupLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {showNavSkeleton ? (
              <SidebarNavSkeleton />
            ) : (
              <SidebarMenu className="gap-0.5">
                {unlockedItems.map((item) => (
                  <NavEntitlementItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    allowed={can(item.featureKey)}
                    isAccessAllowed={entitlements.isAccessAllowed}
                  />
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {!showNavSkeleton && lockedItems.length > 0 ? (
          <>
            <SidebarSeparator
              className={cn(
                "mx-3 bg-neutral-200/80 dark:bg-neutral-800",
                dashboardSidebarTokens.collapsedHidden,
              )}
            />
            <SidebarGroup className="p-1 pt-0">
              <SidebarGroupLabel
                className={cn(dashboardSidebarTokens.premiumLabel, "px-2")}
              >
                <Crown className="size-3.5" />
                <span>Upgrade to unlock</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {lockedItems.map((item) => (
                    <NavEntitlementItem
                      key={item.title}
                      item={item}
                      pathname={pathname}
                      allowed={can(item.featureKey)}
                      isAccessAllowed={entitlements.isAccessAllowed}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="shrink-0 gap-1.5 border-t border-neutral-100/80 pt-2 dark:border-neutral-800/80">
        {showPlanFooter ? (
          isHydrating ? (
            <>
              <div
                className={cn(
                  dashboardSidebarTokens.upgradeCard,
                  "mx-2 mb-1 h-[76px] animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800/60",
                  dashboardSidebarTokens.collapsedHidden,
                )}
                aria-hidden
              />
              <div
                className={cn(
                  "mx-2 mb-1 hidden h-8 animate-pulse rounded-lg bg-neutral-100 group-data-[collapsible=icon]:block dark:bg-neutral-800/60",
                )}
                aria-hidden
              />
            </>
          ) : (
            <>
              <div className={dashboardSidebarTokens.collapsedHidden}>
                {showUpgradeCard ? (
                  <DashboardSidebarUpgrade {...planSummaryProps} />
                ) : (
                  <DashboardSidebarStaffInactive />
                )}
              </div>
              <DashboardSidebarPlanCollapsed {...planSummaryProps} />
            </>
          )
        ) : null}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarUserAccountMenu
              userName={userName}
              roleLabel={roleLabel}
              avatarClassName={
                avatarClassName ??
                "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <DashboardSidebarRail />
    </Sidebar>
  );
}
