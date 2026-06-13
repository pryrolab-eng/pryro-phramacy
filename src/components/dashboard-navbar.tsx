'use client'

import Link from 'next/link'
import { signOutClient } from '@/lib/auth/client-sign-out'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { UserCircle, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'

export default function DashboardNavbar() {
  const router = useRouter()

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" prefetch className="text-xl font-bold">
            Pryrox
          </Link>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/app" className="hover:text-blue-600">App</Link>
            <Link href={PHARMACY_ROUTES.inventory} className="hover:text-blue-600">Inventory</Link>
            <Link href={PHARMACY_ROUTES.pos} className="hover:text-blue-600">POS</Link>
            <Link href={PHARMACY_ROUTES.sales} className="hover:text-blue-600">Sales</Link>
            <Link href={PHARMACY_ROUTES.customers} className="hover:text-blue-600">Customers</Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={async () => {
                await signOutClient()
              }}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
