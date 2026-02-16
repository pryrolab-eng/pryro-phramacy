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
  FileText,
  Settings,
  LogOut,
  Stethoscope,
  User,
  HelpCircle,
  Search,
  MoreVertical,
  AlertCircle,
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
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"


const pharmacistData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/pharmacist-dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Prescriptions",
      url: "/prescriptions",
      icon: FileText,
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
      title: "Customers",
      url: "/customers",
      icon: Users,
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

export function PharmacistSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userName, setUserName] = React.useState('Pharmacist')
  const [daysLeft, setDaysLeft] = React.useState<number | null>(null)
  const [isExpired, setIsExpired] = React.useState(false)
  const [subscriptionPlan, setSubscriptionPlan] = React.useState('standard')
  
  let pathname = '/pharmacist-dashboard'
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
            setUserName(emailName || 'Pharmacist')
          }
          
          // Get pharmacy subscription info
          const { data: userPharmacy } = await supabase
            .from('pharmacy_users')
            .select('pharmacy_id')
            .eq('user_id', user.id)
            .single()
          
          if (userPharmacy) {
            const { data: pharmacy } = await supabase
              .from('pharmacies')
              .select('subscription_plan, subscription_expires_at, status')
              .eq('id', userPharmacy.pharmacy_id)
              .single()
            
            if (pharmacy) {
              setSubscriptionPlan(pharmacy.subscription_plan || 'trial')
              
              if (pharmacy.subscription_expires_at) {
                const expiryDate = new Date(pharmacy.subscription_expires_at)
                const today = new Date()
                const diffTime = expiryDate.getTime() - today.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                const days = diffDays > 0 ? diffDays : 0
                setDaysLeft(days)
                setIsExpired(days === 0 || pharmacy.status === 'suspended')
              }
            }
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
              <Link href="/pharmacist-dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-600 text-white">
                  <Stethoscope className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Pryrox</span>
                  <span className="truncate text-xs">Pharmacist</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pharmacist Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pharmacistData.navMain.map((item) => {
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
        {isExpired && (
          <div className="mx-2 mb-2 p-2 bg-red-50 border border-red-500 rounded-lg">
            <span className="text-[10px] font-bold text-red-700">Suspended</span>
          </div>
        )}
        
        <Card className="mx-2 mb-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{userName}</div>
                  <div className="text-xs text-gray-500">Pharmacist</div>
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