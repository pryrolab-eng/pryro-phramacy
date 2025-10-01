"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserPlus,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Pill,
  Calendar,
  AlertTriangle,
  Crown,
  Zap,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


const pharmacyData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/pharmacy-dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
    },
    {
      title: "POS",
      url: "/pos",
      icon: ShoppingCart,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: BarChart3,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Staff",
      url: "/staff",
      icon: UserPlus,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

export function PharmacySidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/pharmacy-dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Pill className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Pryrox</span>
                  <span className="truncate text-xs">Pharmacy</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pharmacy Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pharmacyData.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="mx-2 mb-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-gray-700">Standard</span>
            <span className="text-xs text-gray-400">15d</span>
          </div>
          <a href="/subscriptions" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
            <Crown className="h-3 w-3" />
            Upgrade to Premium
          </a>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/api/auth/signout">
                <LogOut />
                <span>Sign Out</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}