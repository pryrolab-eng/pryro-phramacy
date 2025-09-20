'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '../../supabase/client'
import { Button } from './ui/button'
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
  Crown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const superAdminNavigation = [
  { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Admin Panel', href: '/admin', icon: Settings },
  { name: 'Pharmacy List', href: '/admin/stores', icon: Building2 },
  { name: 'Categories', href: '/admin/categories', icon: Tag },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
]

const pharmacyOwnerNavigation = [
  { name: 'Pharmacy Dashboard', href: '/pharmacy-dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Sales', href: '/sales', icon: Receipt },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Staff Manage', href: '/staff', icon: UserCog },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const pharmacistNavigation = [
  { name: 'Pharmacist Dashboard', href: '/pharmacist-dashboard', icon: Pill },
  { name: 'Prescriptions', href: '/prescriptions', icon: Receipt },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('')
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
        
        if (user?.email === 'abdousentore@gmail.com') {
          role = 'superadmin'
        } else if (user) {
          const { data: pharmacyUser } = await supabase
            .from('pharmacy_users')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()
          
          if (pharmacyUser?.role) {
            role = pharmacyUser.role === 'pharmacist' ? 'pharmacist' : 'pharmacy_owner'
          }
        }
        
        setUserRole(role)
        sessionStorage.setItem('userRole', role)
      } catch (error) {
        setUserRole('pharmacy_owner')
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

      <div className="p-3">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          title={isCollapsed ? 'Sign Out' : ''}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && 'Sign Out'}
        </Button>
      </div>
      </div>
    </>
  )
}