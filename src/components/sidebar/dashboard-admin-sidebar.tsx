"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { LogOut, Shield } from "lucide-react";

import { ADMIN_SIDEBAR_NAV } from "@/lib/admin/navigation";

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

} from "@/components/ui/sidebar";

import { DashboardSidebarRail } from "@/components/sidebar/dashboard-sidebar-rail";

import { DashboardSidebarBrand } from "@/components/sidebar/dashboard-sidebar-brand";

import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";

import { cn } from "@/lib/utils";



export function DashboardAdminSidebar(

  props: React.ComponentProps<typeof Sidebar>,

) {

  const pathname = usePathname();



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

          "gap-1 px-1 py-2",

          dashboardSidebarTokens.sidebarScroll,

        )}

      >

        <SidebarGroup className="p-1">

          <SidebarGroupLabel className={dashboardSidebarTokens.groupLabel}>

            Administration

          </SidebarGroupLabel>

          <SidebarGroupContent>

            <SidebarMenu className="gap-0.5">

              {ADMIN_SIDEBAR_NAV.map((item) => {

                const isActive =

                  item.url === "/admin"

                    ? pathname === "/admin" || pathname === "/superadmin"

                    : pathname === item.url ||

                      pathname.startsWith(`${item.url}/`);



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

      </SidebarContent>



      <SidebarFooter className="border-t border-neutral-100/80 p-2 dark:border-neutral-800/80">

        <SidebarMenu>

          <SidebarMenuItem>

            <SidebarMenuButton

              asChild

              tooltip="Sign out"

              className={cn(

                dashboardSidebarTokens.navItem,

                "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30",

              )}

            >

              <Link href="/api/auth/signout">

                <LogOut className="size-4" />

                <span>Sign out</span>

              </Link>

            </SidebarMenuButton>

          </SidebarMenuItem>

        </SidebarMenu>

      </SidebarFooter>

      <DashboardSidebarRail />

    </Sidebar>

  );

}

