'use client'

import { AdminBillingPanel } from '@/components/admin/admin-billing-panel'
import { DashboardPageShell } from '@/components/dashboard'

export default function AdminBillingPage() {
  return (
    <DashboardPageShell>
      <AdminBillingPanel />
    </DashboardPageShell>
  )
}
