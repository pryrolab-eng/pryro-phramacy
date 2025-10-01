'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '../../supabase/client'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  Settings,
  LogOut,
  Building2,
  Tag,
  Megaphone,
  CreditCard,
  BarChart3,
  UserCog,
  Shield,
  Pill,
  Crown,
  FileText
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const superAdminNavigation = [
  { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Admin Panel', href: '/admin', icon: Settings },
  { name: 'Pharmacy List', href: '/admin/stores', icon: Building2 },
  { name: 'Categories', href: '/admin/categories', icon: Tag },
  { name: 'Template Designer', href: '/admin/insurance-templates', icon: FileText },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
]

const pharmacyOwnerNavigation = [
  { name: 'Pharmacy Dashboard', href: '/pharmacy-dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Sales', href: '/sales', icon: Receipt },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Branches', href: '/branches', icon: Building2 },
  { name: 'Template Designer', href: '/admin/insurance-templates', icon: FileText },
  { name: 'Staff Manage', href: '/staff', icon: UserCog },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const pharmacistNavigation = [
  { name: 'Pharmacist Dashboard', href: '/pharmacist-dashboard', icon: Pill },
  { name: 'Prescriptions', href: '/prescriptions', icon: Receipt },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
]

function SubscriptionPlanCard() {
  const [planData, setPlanData] = useState({
    plan: 'Standard',
    daysRemaining: 25,
    totalDays: 30,
    status: 'active'
  })

  useEffect(() => {
    // Calculate days remaining (mock data)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 25)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    setPlanData(prev => ({ ...prev, daysRemaining: diffDays }))
  }, [])

  const getStatusColor = () => {
    if (planData.daysRemaining <= 7) return 'text-red-600 bg-red-50'
    if (planData.daysRemaining <= 15) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <Card className="border-blue-200">
      <CardContent className="p-2">
        <div className="flex items-center space-x-1 mb-1">
          <Crown className="h-3 w-3 text-blue-600" />
          <span className="text-xs font-medium text-gray-900">{planData.plan} Plan</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">Days remaining</span>
            <span className={`text-[10px] px-1 py-0.5 rounded ${getStatusColor()}`}>
              {planData.daysRemaining} days
            </span>
          </div>
          <Link href="/settings" className="block">
            <Button variant="outline" size="sm" className="w-full text-[10px] h-6">
              Manage Plan
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('')
  const [userName, setUserName] = useState<string>('User')
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const cachedRole = sessionStorage.getItem('userRole')
    if (cachedRole) {
      setUserRole(cachedRole)
      setIsLoading(false)
      return
    }
    
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        let role = 'pharmacy_owner'
        
        if (user) {
          // Check if user is super admin by email
          if (user.email === 'abdousentore@gmail.com') {
            role = 'superadmin'
          } else {
            // Check pharmacy_users table for pharmacy-specific roles
            const { data: pharmacyUser } = await supabase
              .from('pharmacy_users')
              .select('role')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .single()
            
            if (pharmacyUser?.role) {
              role = pharmacyUser.role
            } else {
              role = 'pharmacist'
            }
          }
        }
        
        setUserRole(role)
        
        // Get display name from database
        let displayName = 'User'
        if (user) {
          const { data: userData } = await supabase
            .from('pharmacy_users')
            .select('display_name')
            .eq('user_id', user.id)
            .single()
          
          displayName = userData?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
        }
        
        setUserName(displayName || 'User')
        sessionStorage.setItem('userRole', role)
      } catch (error) {
        console.error('Error getting user role:', error)
        setUserRole('pharmacist')
      } finally {
        setIsLoading(false)
      }
    }
    getUserRole()
  }, [])

  const getNavigationForRole = () => {
    switch (userRole) {
      case 'superadmin':
        return superAdminNavigation
      case 'pharmacist':
        return pharmacistNavigation
      default:
        return pharmacyOwnerNavigation
    }
  }

  const handleSignOut = async () => {
    sessionStorage.removeItem('userRole')
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  if (isLoading) {
    return (
      <>
        <div className="flex h-screen w-64 flex-col bg-gray-100 border-r border-gray-200">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-blue-600">Pryro</span>
              <span className="text-xs text-black">For pharmacy</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </>
    )
  }

  const navigation = getNavigationForRole()

  return (
    <>

      
      <div className={`flex h-screen ${isCollapsed ? 'w-16' : 'w-64'} flex-col bg-gray-100 border-r border-gray-200 flex-shrink-0 transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between px-6">
          {!isCollapsed && (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-blue-600">Pryro</span>
              <span className="text-xs text-black">For pharmacy</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      
        {!isCollapsed && (
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {userRole === 'superadmin' ? 'Super Admin' : userRole === 'pharmacist' ? 'Pharmacist' : 'Pharmacy Owner'}
            </div>
          </div>
        )}
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 space-y-3">
        {/* Subscription Plan Card - Only for Pharmacy Owners */}
        {userRole === 'pharmacy_owner' && !isCollapsed && (
          <SubscriptionPlanCard />
        )}
        
        {!isCollapsed ? (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {(userName || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{userName}</div>
                    <div className="text-xs text-gray-500">
                      {userRole === 'superadmin' ? 'Super Admin' : userRole === 'pharmacist' ? 'Pharmacist' : 'Pharmacy Owner'}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:bg-red-50 hover:text-red-600"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {(userName || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-600 hover:bg-red-50 hover:text-red-600"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      </div>
    </>
  )
}