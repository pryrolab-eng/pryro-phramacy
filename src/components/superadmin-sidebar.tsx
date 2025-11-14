"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  Store,
  Users,
  Settings,
  BarChart3,
  Package,
  CreditCard,
  FileText,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,

} from "@/components/ui/sidebar"


const superadminData = {
  user: {
    name: "Super Admin",
    email: "abdousentore@gmail.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/superadmin",
      icon: BarChart3,
    },
    {
      title: "Admin Panel",
      url: "/admin",
      icon: Shield,
    },
    {
      title: "Pharmacy List",
      url: "/admin/stores",
      icon: Store,
    },
    {
      title: "Categories",
      url: "/admin/categories",
      icon: Package,
    },
    {
      title: "Subscriptions",
      url: "/admin/subscriptions",
      icon: CreditCard,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: FileText,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
}

export function SuperadminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  let pathname = '/superadmin'
  try {
    pathname = usePathname()
  } catch (error) {
    // Fallback when usePathname is not available
    console.log('usePathname not available, using fallback')
  }
  
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/superadmin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-red-600 text-white">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Pryrox</span>
                  <span className="truncate text-xs">Super Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {superadminData.navMain.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/api/auth/signout">
                <LogOut />
                <span>Sign Out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}