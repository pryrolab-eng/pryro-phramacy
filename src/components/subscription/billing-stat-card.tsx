'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

interface BillingStatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  sub?: string
  loading?: boolean
  /** Optional colour accent on the icon wrapper */
  accent?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const accentClasses: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red:    'bg-red-50 text-red-600',
}

/**
 * Reusable stat card for billing dashboards.
 * Shows an icon, a primary value, a label, and an optional sub-text.
 */
export function BillingStatCard({
  icon,
  label,
  value,
  sub,
  loading = false,
  accent = 'blue',
}: BillingStatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 shrink-0 ${accentClasses[accent]}`}>
            {icon}
          </div>
          <div className="min-w-0">
            {loading ? (
              <>
                <Skeleton className="h-7 w-20 mb-1" />
                <Skeleton className="h-3.5 w-28" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold leading-tight truncate">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                {sub && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
