'use client'

import { AdminSubscriptionsPanel } from '@/components/admin/admin-subscriptions-panel'
import { DashboardPageShell } from '@/components/dashboard'

export default function SubscriptionsPage() {
  return (
    <DashboardPageShell>
      <AdminSubscriptionsPanel />
    </DashboardPageShell>
  )
}
