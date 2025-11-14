"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "../../supabase/client"
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
  User,
  HelpCircle,
  Search,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"


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
  profileActions: [
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
  ],
}

export function PharmacySidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userName, setUserName] = React.useState('Pharmacy Owner')
  
  let pathname = '/pharmacy-dashboard'
  try {
    pathname = usePathname()
  } catch (error) {
    // Fallback when usePathname is not available
    console.log('usePathname not available, using fallback')
  }
  
  React.useEffect(() => {
    const fetchUserName = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Try to get full name from user metadata or profile
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name
          if (fullName) {
            setUserName(fullName)
          } else {
            // Fallback to email username
            const emailName = user.email?.split('@')[0]
            setUserName(emailName || 'Pharmacy Owner')
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error)
      }
    }
    
    fetchUserName()
  }, [])
  
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/pharmacy-dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Pill className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Pryrox</span>
                  <span className="truncate text-xs">Pharmacy</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pharmacy Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pharmacyData.navMain.map((item) => {
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
        <div className="mx-2 mb-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-gray-700">Standard</span>
            <span className="text-xs text-gray-400">15d</span>
          </div>
          <Link href="/subscriptions" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
            <Crown className="h-3 w-3" />
            Upgrade to Premium
          </Link>
        </div>
        
        <Card className="mx-2 mb-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{userName}</div>
                  <div className="text-xs text-gray-500">Pharmacy Owner</div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" sideOffset={8}>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Get Help
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => alert('Search functionality coming soon!')}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { if(confirm('Are you sure you want to sign out?')) window.location.href = '/api/auth/signout' }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </SidebarFooter>
    </Sidebar>
  )
}