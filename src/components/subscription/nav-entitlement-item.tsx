"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItemConfig } from "@/lib/subscription/nav-config";
import { getNavEntitlementDisplayMode } from "@/lib/subscription/nav-entitlement-display";

type Props = {
  item: NavItemConfig;
  pathname: string;
  allowed: boolean;
  isAccessAllowed: boolean;
  upgradeHref: string;
};

export function NavEntitlementItem({
  item,
  pathname,
  allowed,
  isAccessAllowed,
  upgradeHref,
}: Props) {
  const isActive = pathname === item.url;

  if (!allowed && !isAccessAllowed) {
    return null;
  }

  if (allowed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link href={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (getNavEntitlementDisplayMode() === "hide") {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="opacity-60"
        onClick={() => window.location.assign(upgradeHref)}
      >
        <Lock className="size-4" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
