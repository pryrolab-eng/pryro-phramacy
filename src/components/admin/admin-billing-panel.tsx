'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wallet,
} from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPharmacyDetailDialog } from '@/components/admin/admin-pharmacy-detail-dialog'
import { adminBillingPaymentColumns } from '@/components/admin/admin-billing-payment-columns'
import { adminBillingPharmacyColumns } from '@/components/admin/admin-billing-pharmacy-columns'
import { adminBillingReconciliationColumns } from '@/components/admin/admin-billing-reconciliation-columns'
import {
  DashboardButton,
  DashboardDataTable,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardTabsList,
} from '@/components/dashboard'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  adminBillingQueryKey,
  adminPharmaciesQueryKey,
  adminPlansQueryKey,
  adminReportsSummaryQueryKey,
  useAdminBilling,
  useAdminPharmacies,
  useAdminPlans,
} from '@/hooks'
import { cancelAdminPendingBilling } from '@/lib/http/admin/billing'
import { fetchJson } from '@/lib/http/client'
import type { AdminPharmacyRow } from '@/lib/http/admin/pharmacies'
import type { AdminBillingReconciliationRow } from '@/lib/http/admin/billing'
import { formatMoney, getPlatformCurrency } from '@/lib/platform-currency'
import { getPendingPaymentMaxAgeDays } from '@/lib/admin/cancel-pending-billing'
import {
  statusToneIconClass,
  statusToneTextClass,
} from '@/lib/ui/status-tone'

function BillingNotice({ message }: { message: string }) {
  return (
    <p
      className={cn(
        'rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-700',
        'dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300',
      )}
      role="status"
    >
      {message}
    </p>
  )
}

export function AdminBillingPanel() {
  const queryClient = useQueryClient()
  const billingQuery = useAdminBilling()
  const pharmaciesQuery = useAdminPharmacies()
  const plansQuery = useAdminPlans()

  const [paymentFilter, setPaymentFilter] = useState('')
  const [pharmacyFilter, setPharmacyFilter] = useState('')
  const [detailPharmacyId, setDetailPharmacyId] = useState<string | null>(null)
  const [cancellingReconId, setCancellingReconId] = useState<string | null>(null)
  const [cancelMsg, setCancelMsg] = useState<string | null>(null)

  const paymentColumns = useMemo(() => adminBillingPaymentColumns(), [])
  const pharmacyColumns = useMemo(() => adminBillingPharmacyColumns(), [])

  const handleCancelReconciliation = useCallback(
    async (row: AdminBillingReconciliationRow) => {
      setCancellingReconId(row.id)
      setCancelMsg(null)
      try {
        if (row.payment_transaction_id) {
          await cancelAdminPendingBilling({
            payment_transaction_id: row.payment_transaction_id,
          })
        } else if (row.subscription_id) {
          await cancelAdminPendingBilling({
            subscription_id: row.subscription_id,
          })
        } else if (row.pharmacy_id) {
          await cancelAdminPendingBilling({ pharmacy_id: row.pharmacy_id })
        }
        setCancelMsg('Pending item cancelled.')
        await queryClient.invalidateQueries({ queryKey: adminBillingQueryKey })
      } catch (e) {
        setCancelMsg(e instanceof Error ? e.message : 'Cancel failed')
      } finally {
        setCancellingReconId(null)
      }
    },
    [queryClient],
  )

  const reconColumns = useMemo(
    () =>
      adminBillingReconciliationColumns({
        onCancel: (row) => void handleCancelReconciliation(row),
        cancellingId: cancellingReconId,
      }),
    [cancellingReconId, handleCancelReconciliation],
  )

  const summary = billingQuery.data?.summary
  const payments = billingQuery.data?.payments ?? []
  const pharmacies = billingQuery.data?.pharmacies ?? []
  const reconciliation = billingQuery.data?.reconciliation ?? []

  const catalogPlans = plansQuery.data?.plans ?? []

  const detailPharmacy = useMemo((): AdminPharmacyRow | null => {
    if (!detailPharmacyId) return null
    const rows = (pharmaciesQuery.data ?? []) as AdminPharmacyRow[]
    return (
      rows.find((p) => p.id === detailPharmacyId) ?? {
        id: detailPharmacyId,
        name:
          pharmacies.find((x) => x.pharmacy_id === detailPharmacyId)?.pharmacy_name ??
          'Pharmacy',
      }
    )
  }, [detailPharmacyId, pharmaciesQuery.data, pharmacies])

  if (billingQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-6" />
        <p className="text-sm text-neutral-500">Loading billing data…</p>
      </div>
    )
  }

  if (billingQuery.isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {billingQuery.error instanceof Error
          ? billingQuery.error.message
          : 'Could not load billing data.'}
      </p>
    )
  }

  const platformCurrency =
    summary?.platform_currency ?? getPlatformCurrency()
  const volumeByCurrency = Object.entries(summary?.volume_by_currency ?? {})
    .filter(([, amount]) => amount > 0)
    .sort(([a], [b]) => {
      if (a === platformCurrency) return -1
      if (b === platformCurrency) return 1
      return a.localeCompare(b)
    })
  const expireDays = getPendingPaymentMaxAgeDays()
  const reconCount = reconciliation.length

  const volumeValue =
    volumeByCurrency.length === 0 ? (
      formatMoney(0, platformCurrency)
    ) : volumeByCurrency.length === 1 ? (
      formatMoney(volumeByCurrency[0][1], volumeByCurrency[0][0])
    ) : (
      <div className="space-y-1">
        {volumeByCurrency.map(([currency, amount]) => (
          <p key={currency} className="text-lg font-semibold leading-tight tabular-nums">
            {formatMoney(amount, currency)}
          </p>
        ))}
      </div>
    )

  return (
    <>
      <AdminPageHeader
        pinTitle="Billing & transactions"
        title="Billing & transactions"
        description="Payments, pharmacy subscription state, and data issues"
        actions={
          <>
            <DashboardButton
              tone="outline"
              onClick={() => void billingQuery.refetch()}
              disabled={billingQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  'mr-2 h-4 w-4',
                  billingQuery.isFetching && 'animate-spin',
                )}
                strokeWidth={1.75}
              />
              Refresh
            </DashboardButton>
            <DashboardButton tone="outline" asChild>
              <Link href="/admin/reports">Reports</Link>
            </DashboardButton>
          </>
        }
      />

      {cancelMsg ? <BillingNotice message={cancelMsg} /> : null}

      <DashboardMetricGrid className="mb-4 lg:grid-cols-4">
        <DashboardStatCard
          label="Completed"
          icon={CheckCircle2}
          iconClassName={statusToneIconClass.success}
          value={summary?.completed_count ?? 0}
        />
        <DashboardStatCard
          label="Pending"
          icon={Clock}
          iconClassName={statusToneIconClass.warning}
          value={summary?.pending_count ?? 0}
        />
        <DashboardStatCard
          label="Failed"
          icon={AlertCircle}
          iconClassName={statusToneIconClass.danger}
          value={summary?.failed_count ?? 0}
          valueClassName={
            (summary?.failed_count ?? 0) > 0
              ? statusToneTextClass.danger
              : undefined
          }
        />
        <DashboardStatCard
          label="Completed volume"
          icon={Wallet}
          value={volumeValue}
          hint={
            volumeByCurrency.length > 1
              ? 'By currency'
              : 'Successful checkouts'
          }
        />
      </DashboardMetricGrid>

      <Tabs defaultValue="payments">
        <DashboardTabsList>
          <TabsTrigger value="payments">
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="pharmacies">
            Pharmacy billing ({pharmacies.length})
          </TabsTrigger>
          <TabsTrigger value="reconciliation">
            Reconciliation{reconCount > 0 ? ` (${reconCount})` : ''}
          </TabsTrigger>
        </DashboardTabsList>

        <TabsContent value="payments" className="mt-4">
          <DashboardDataTable
            title="Payment transactions"
            description="Polar subscription checkouts"
            searchPlaceholder="Search pharmacy, customer, status…"
            searchValue={paymentFilter}
            onSearchChange={setPaymentFilter}
            columns={paymentColumns}
            data={payments}
            pageSize={15}
            pageSizeOptions={[10, 15, 25, 50]}
            stickyHeader
            initialSorting={[{ id: 'created_at', desc: true }]}
            emptyMessage="No transactions yet."
          />
        </TabsContent>

        <TabsContent value="pharmacies" className="mt-4">
          <DashboardDataTable
            title="Pharmacy subscriptions"
            description="Effective main plan and billing status per store (click a row for details)"
            searchPlaceholder="Search pharmacy or plan…"
            searchValue={pharmacyFilter}
            onSearchChange={setPharmacyFilter}
            columns={pharmacyColumns}
            data={pharmacies}
            onRowClick={(row) => setDetailPharmacyId(row.pharmacy_id)}
            pageSize={15}
            pageSizeOptions={[10, 15, 25, 50]}
            stickyHeader
            emptyMessage="No pharmacies found."
          />
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-4">
          <DashboardDataTable
            title="Reconciliation"
            description={`Orphan payments, pending upgrades, and legacy plan rows without plan_id. Pending items older than ${expireDays} days can be auto-cancelled when the scheduled job runs (see /api/cron/cancel-stale-pending-payments).`}
            columns={reconColumns}
            data={reconciliation}
            pageSize={10}
            onRowClick={(row) => {
              if (row.pharmacy_id) setDetailPharmacyId(row.pharmacy_id)
            }}
            emptyMessage="No issues detected."
          />
        </TabsContent>
      </Tabs>

      {detailPharmacy ? (
        <AdminPharmacyDetailDialog
          key={detailPharmacyId ?? detailPharmacy.name}
          pharmacy={detailPharmacy}
          catalog={catalogPlans}
          onClose={() => {
            setDetailPharmacyId(null)
            void queryClient.invalidateQueries({ queryKey: adminBillingQueryKey })
            void queryClient.invalidateQueries({ queryKey: adminPharmaciesQueryKey })
          }}
        />
      ) : null}
    </>
  )
}
