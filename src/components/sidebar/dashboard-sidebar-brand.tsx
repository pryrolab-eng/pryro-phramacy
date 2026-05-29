"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { PharmacyBrandLogo } from "@/components/pharmacy/pharmacy-brand-logo";
import { dashboardChrome } from "@/components/dashboard/dashboard-tokens";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  logoUrl?: string | null;
  primaryColor?: string;
  /** Hide subtitle when it matches the title (e.g. both "Pharmacy"). */
  hideSubtitleWhenSameAsTitle?: boolean;
};

export function DashboardSidebarBrand({
  href,
  icon: Icon,
  title,
  subtitle,
  logoUrl,
  primaryColor = "#3b82f6",
  hideSubtitleWhenSameAsTitle,
}: Props) {
  const hasLogo = Boolean(logoUrl?.trim());
  const showSubtitle =
    Boolean(subtitle?.trim()) &&
    !(
      hideSubtitleWhenSameAsTitle &&
      subtitle.trim().toLowerCase() === title.trim().toLowerCase()
    );

  return (
    <SidebarHeader
      className={cn(
        dashboardChrome.height,
        dashboardChrome.sidebarHeader,
      )}
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            asChild
            tooltip={title}
            className={cn(
              "h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
              "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0",
            )}
          >
            <Link href={href}>
              <div
                className={cn(
                  dashboardSidebarTokens.brandIcon,
                  "size-8 shrink-0",
                  hasLogo && "border-0 bg-transparent p-0",
                )}
                style={
                  !hasLogo
                    ? { backgroundColor: `${primaryColor}18` }
                    : undefined
                }
              >
                <PharmacyBrandLogo
                  logoUrl={logoUrl}
                  name={title}
                  icon={Icon}
                  imageClassName={cn(
                    "h-7 w-auto max-w-[120px]",
                    "group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:max-w-[1.5rem]",
                  )}
                />
              </div>
              <div
                className={cn(
                  "grid min-w-0 flex-1 text-left leading-tight",
                  dashboardSidebarTokens.collapsedHidden,
                )}
              >
                <span className={dashboardSidebarTokens.brandTitle}>{title}</span>
                {showSubtitle ? (
                  <span className={dashboardSidebarTokens.brandSubtitle}>
                    {subtitle}
                  </span>
                ) : null}
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
