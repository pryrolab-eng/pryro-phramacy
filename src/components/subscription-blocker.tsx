'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from 'lucide-react'

interface SubscriptionBlockerProps {
  isExpired: boolean
  userRole: string
}

export default function SubscriptionBlocker({ isExpired, userRole }: SubscriptionBlockerProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isExpired && !pathname.includes('/settings')) {
      router.push('/settings')
    }
  }, [isExpired, pathname, router])

  if (!isExpired || pathname.includes('/settings')) {
    return null
  }

  const isOwner = userRole === 'pharmacy_owner'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="max-w-md w-full mx-4 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-red-700">
              {isOwner ? 'Subscription Expired' : 'Access Suspended'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isOwner 
                ? 'Your pharmacy access has been suspended' 
                : 'Pharmacy subscription has expired'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-sm text-red-700 font-medium">
              {isOwner 
                ? 'All system features are blocked until you renew your subscription.'
                : 'Please contact your pharmacy owner to renew the subscription.'}
            </p>
          </div>
          {isOwner && (
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
              onClick={() => router.push('/settings')}
            >
              Renew Subscription Now
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
