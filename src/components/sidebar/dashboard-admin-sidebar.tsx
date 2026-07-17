"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Sparkles } from "lucide-react";
import {
  ADMIN_SIDEBAR_GROUPS,
  isAdminNavItemActive,
} from "@/lib/admin/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { DashboardSidebarRail } from "@/components/sidebar/dashboard-sidebar-rail";
import { DashboardSidebarBrand } from "@/components/sidebar/dashboard-sidebar-brand";
import { AdminSidebarUserMenu } from "@/components/sidebar/admin-sidebar-user-menu";
import { useSidebarUserName } from "@/components/sidebar/use-sidebar-user-name";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";
import { cn } from "@/lib/utils";

export function DashboardAdminSidebar(
  props: React.ComponentProps<typeof Sidebar>,
) {
  const pathname = usePathname();
  const userName = useSidebarUserName("Admin");

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950/50"
      {...props}
    >
      <DashboardSidebarBrand
        href="/admin"
        icon={Shield}
        title="Pryrox"
        subtitle="Platform admin"
      />

      <SidebarContent
        className={cn(
          "min-h-0 flex-1 gap-0.5 px-1 py-2",
          dashboardSidebarTokens.sidebarScroll,
        )}
      >
        {ADMIN_SIDEBAR_GROUPS.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 ? (
              <SidebarSeparator
                className={cn(
                  "mx-3 my-1 bg-neutral-200/80 dark:bg-neutral-800",
                  dashboardSidebarTokens.collapsedHidden,
                )}
              />
            ) : null}
            <SidebarGroup className="p-1">
              <SidebarGroupLabel className={dashboardSidebarTokens.groupLabel}>
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const isActive = isAdminNavItemActive(pathname, item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            dashboardSidebarTokens.navItem,
                            dashboardSidebarTokens.navActive,
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon className="size-4" strokeWidth={1.75} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="shrink-0 gap-1.5 border-t border-neutral-100/80 p-2 dark:border-neutral-800/80">
        <div
          className={cn(
            "mx-1 mb-1 flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-2 text-xs text-neutral-600 dark:border-primary/20 dark:bg-primary/10 dark:text-neutral-300",
            dashboardSidebarTokens.collapsedHidden,
          )}
        >
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 leading-snug">
            <span className="font-medium text-primary">
              Ctrl+K
            </span>{" "}
            global search
          </span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <AdminSidebarUserMenu userName={userName} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <DashboardSidebarRail />
    </Sidebar>
  );
}
