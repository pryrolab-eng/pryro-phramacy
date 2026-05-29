'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  isRouteAllowedWhenSubscriptionInactive,
  resolveSubscriptionHomePath,
} from '@/lib/subscription/subscription-grace-routes'

interface SubscriptionBlockerProps {
  isExpired: boolean
  userRole: string
}

/**
 * When subscription is inactive, keep role home + billing open.
 * Everything else redirects to the role dashboard welcome screen.
 */
export default function SubscriptionBlocker({
  isExpired,
  userRole,
}: SubscriptionBlockerProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isExpired) return
    if (isRouteAllowedWhenSubscriptionInactive(pathname, userRole)) return
    router.replace(resolveSubscriptionHomePath(userRole))
  }, [isExpired, pathname, router, userRole])

  return null
}
