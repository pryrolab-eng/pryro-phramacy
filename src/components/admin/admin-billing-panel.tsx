'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Receipt, RefreshCw } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPharmacyDetailDialog } from '@/components/admin/admin-pharmacy-detail-dialog'
import { adminBillingPaymentColumns } from '@/components/admin/admin-billing-payment-columns'
import { adminBillingPharmacyColumns } from '@/components/admin/admin-billing-pharmacy-columns'
import { adminBillingReconciliationColumns } from '@/components/admin/admin-billing-reconciliation-columns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export function AdminBillingPanel() {
  const queryClient = useQueryClient()
  const billingQuery = useAdminBilling()
  const pharmaciesQuery = useAdminPharmacies()
  const plansQuery = useAdminPlans()

  const [backfilling, setBackfilling] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null)
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
    return rows.find((p) => p.id === detailPharmacyId) ?? {
      id: detailPharmacyId,
      name: pharmacies.find((x) => x.pharmacy_id === detailPharmacyId)?.pharmacy_name ?? 'Pharmacy',
    }
  }, [detailPharmacyId, pharmaciesQuery.data, pharmacies])

  const handleBackfill = async () => {
    setBackfilling(true)
    setBackfillMsg(null)
    try {
      const res = await fetchJson<{ synced: number; skipped: number }>(
        '/api/admin/transactions/backfill',
        { method: 'POST' },
      )
      setBackfillMsg(
        `Created ${res.synced} invoice(s). ${res.skipped} skipped.`,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminBillingQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminReportsSummaryQueryKey }),
      ])
    } catch (e) {
      setBackfillMsg(e instanceof Error ? e.message : 'Backfill failed')
    } finally {
      setBackfilling(false)
    }
  }

  if (billingQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (billingQuery.isError) {
    return (
      <p className="text-destructive p-6" role="alert">
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Receipt className="h-8 w-8 text-primary" />
            Billing &amp; transactions
          </h1>
        }
        description="Payments, pharmacy subscription state, and data issues"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void billingQuery.refetch()}
              disabled={billingQuery.isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${billingQuery.isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleBackfill()}
              disabled={backfilling}
            >
              {backfilling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="mr-2 h-4 w-4" />
              )}
              Sync invoices
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/reports">Reports</Link>
            </Button>
          </div>
        }
      />

      {backfillMsg ? (
        <p className="text-sm text-muted-foreground rounded-md border px-3 py-2 bg-muted/40">
          {backfillMsg}
        </p>
      ) : null}
      {cancelMsg ? (
        <p className="text-sm text-muted-foreground rounded-md border px-3 py-2 bg-muted/40">
          {cancelMsg}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary?.completed_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary?.pending_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary?.failed_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {volumeByCurrency.length === 0 ? (
              <p className="text-2xl font-bold">0 {platformCurrency}</p>
            ) : (
              volumeByCurrency.map(([currency, amount]) => (
                <p key={currency} className="text-xl font-bold leading-tight">
                  {formatMoney(amount, currency)}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="pharmacies">Pharmacy billing</TabsTrigger>
          <TabsTrigger value="reconciliation">
            Reconciliation
            {reconciliation.length > 0 ? ` (${reconciliation.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment transactions</CardTitle>
              <CardDescription>
                KPay and Polar subscription checkouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={paymentColumns}
                data={payments}
                globalFilter={paymentFilter}
                onGlobalFilterChange={setPaymentFilter}
                toolbar={
                  <Input
                    placeholder="Search pharmacy, customer, status…"
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="max-w-sm"
                  />
                }
                pageSize={15}
                stickyHeader
                enableSorting
                initialSorting={[{ id: 'created_at', desc: true }]}
                emptyMessage="No transactions yet."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pharmacies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy subscriptions</CardTitle>
              <CardDescription>
                Effective main plan and billing status per store (click a row for
                details)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={pharmacyColumns}
                data={pharmacies}
                globalFilter={pharmacyFilter}
                onGlobalFilterChange={setPharmacyFilter}
                onRowClick={(row) => setDetailPharmacyId(row.pharmacy_id)}
                toolbar={
                  <Input
                    placeholder="Search pharmacy or plan…"
                    value={pharmacyFilter}
                    onChange={(e) => setPharmacyFilter(e.target.value)}
                    className="max-w-sm"
                  />
                }
                pageSize={15}
                stickyHeader
                enableSorting
                emptyMessage="No pharmacies found."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation</CardTitle>
              <CardDescription>
                Orphan payments, pending upgrades, and legacy plan rows without{' '}
                <code className="text-xs">plan_id</code>. Pending items older than{' '}
                {expireDays} days are auto-cancelled by cron.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={reconColumns}
                data={reconciliation}
                pageSize={10}
                onRowClick={(row) => {
                  if (row.pharmacy_id) setDetailPharmacyId(row.pharmacy_id)
                }}
                emptyMessage="No issues detected."
                enableSorting
              />
            </CardContent>
          </Card>
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
          }}
        />
      ) : null}
    </div>
  )
}
