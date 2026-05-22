'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  Loader2,
  RefreshCw,
  Receipt,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { useAdminTransactions } from '@/hooks/useAdminTransactions'
import {
  useAdminSubscriptions,
  useSuspendSubscription,
  useReactivateSubscription,
  type AdminSubscriberRow,
} from '@/hooks/useAdminSubscriptions'
import { fetchJson } from '@/lib/http/client'
import {
  TransactionsTable,
  SubscriptionsTable,
  AdminSubscribersTable,
  InvoicesTable,
  BillingStatCard,
} from '@/components/subscription'
import { useAdminSaasInvoices } from '@/hooks/useSaasSubscription'

export default function AdminBillingPage() {
  const txQuery = useAdminTransactions()
  const subsQuery = useAdminSubscriptions()
  const suspendMutation = useSuspendSubscription()
  const reactivateMutation = useReactivateSubscription()
  // Admin-level: fetch all invoices across the platform
  const invoicesQuery = useAdminSaasInvoices()

  const [backfilling, setBackfilling] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const transactions = txQuery.data?.transactions ?? []
  const legacySubscriptions = txQuery.data?.subscriptions ?? []
  const subscribers = subsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []

  // ── Derived stats ──────────────────────────────────────
  const activeCount = subscribers.filter(s => s.status === 'active').length
  const trialingCount = subscribers.filter(s => s.status === 'trialing').length
  const pastDueCount = subscribers.filter(s => s.status === 'past_due').length
  const cancelledCount = subscribers.filter(s =>
    s.status === 'cancelled' || s.status === 'expired'
  ).length

  const completedTxs = transactions.filter(t => t.status === 'completed')
  const completedTotal = completedTxs.reduce((sum, t) => sum + Number(t.amount ?? 0), 0)
  const pendingTotal = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0)

  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length
  const paidInvoices = invoices.filter(i => i.status === 'paid').length

  const isLoading = txQuery.isPending || subsQuery.isPending

  // ── Handlers ───────────────────────────────────────────
  const handleBackfill = async () => {
    setBackfilling(true)
    setBackfillMsg(null)
    try {
      const res = await fetchJson<{ synced: number; skipped: number }>(
        '/api/admin/transactions/backfill',
        { method: 'POST' }
      )
      setBackfillMsg(
        `Created ${res.synced} invoice(s). ${res.skipped} already had records or were skipped.`
      )
      await txQuery.refetch()
    } catch (e) {
      setBackfillMsg(e instanceof Error ? e.message : 'Backfill failed')
    } finally {
      setBackfilling(false)
    }
  }

  const handleSuspend = async (row: AdminSubscriberRow) => {
    setActionLoadingId(row.id)
    const tid = toast.loading(`Revoking ${row.pharmacy?.name ?? 'subscription'}…`)
    try {
      await suspendMutation.mutateAsync({ id: row.id })
      toast.success('Subscription revoked', {
        id: tid,
        description: `${row.pharmacy?.name ?? 'Pharmacy'} has lost access to all paid features.`,
      })
    } catch (err) {
      toast.error('Revoke failed', {
        id: tid,
        description: err instanceof Error ? err.message : 'Could not revoke subscription',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReactivate = async (row: AdminSubscriberRow) => {
    setActionLoadingId(row.id)
    const tid = toast.loading(`Reactivating ${row.pharmacy?.name ?? 'subscription'}…`)
    try {
      await reactivateMutation.mutateAsync(row.id)
      toast.success('Subscription reactivated', {
        id: tid,
        description: `${row.pharmacy?.name ?? 'Pharmacy'} has been restored for one month.`,
      })
    } catch (err) {
      toast.error('Reactivation failed', {
        id: tid,
        description: err instanceof Error ? err.message : 'Could not reactivate subscription',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (txQuery.isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-destructive" role="alert">
          {txQuery.error instanceof Error
            ? txQuery.error.message
            : 'Could not load billing data.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-8 w-8 text-blue-600" />
            Billing &amp; Subscriptions
          </h1>
          <p className="text-muted-foreground mt-1">
            Track payments, manage pharmacy subscriptions, and control access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              void txQuery.refetch()
              void subsQuery.refetch()
              void invoicesQuery.refetch()
            }}
            disabled={txQuery.isFetching || subsQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${(txQuery.isFetching || subsQuery.isFetching) ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleBackfill()}
            disabled={backfilling}
          >
            {backfilling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Receipt className="h-4 w-4 mr-2" />
            )}
            Sync invoices
          </Button>
        </div>
      </div>

      {backfillMsg && (
        <p className="text-sm text-muted-foreground rounded-md border px-3 py-2 bg-muted/40">
          {backfillMsg}
        </p>
      )}

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BillingStatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Active subscriptions"
          value={activeCount}
          sub={trialingCount > 0 ? `+${trialingCount} trialing` : undefined}
          accent="green"
        />
        <BillingStatCard
          icon={<Users className="h-5 w-5" />}
          label="Total subscribers"
          value={subscribers.length}
          sub={cancelledCount > 0 ? `${cancelledCount} cancelled / expired` : undefined}
          accent="blue"
        />
        <BillingStatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Past due / overdue"
          value={pastDueCount + overdueInvoices}
          sub={`${pastDueCount} subscriptions · ${overdueInvoices} invoices`}
          accent="orange"
        />
        <BillingStatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Completed volume"
          value={`RWF ${completedTotal.toLocaleString()}`}
          sub={
            pendingTotal > 0
              ? `RWF ${pendingTotal.toLocaleString()} pending`
              : `${completedTxs.length} transactions`
          }
          accent="purple"
        />
      </div>

      {/* ── Secondary stats row ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <BillingStatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Completed payments"
          value={completedTxs.length}
          sub="Across all providers"
          accent="green"
        />
        <BillingStatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Invoices paid"
          value={paidInvoices}
          sub={`${invoices.length} total invoices`}
          accent="blue"
        />
        <BillingStatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Overdue invoices"
          value={overdueInvoices}
          sub={overdueInvoices > 0 ? 'Requires attention' : 'All clear'}
          accent={overdueInvoices > 0 ? 'red' : 'green'}
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Subscribers
            {subscribers.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {subscribers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            Transactions
            {transactions.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {transactions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-1.5">
            <Receipt className="h-4 w-4" />
            Invoices
            {invoices.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {invoices.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="legacy">Legacy records</TabsTrigger>
        </TabsList>

        {/* ── Subscribers tab ── */}
        <TabsContent value="subscribers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All subscribers</CardTitle>
              <CardDescription>
                Every pharmacy subscription — search, sort, and manage access in real time.
                Revoking a subscription immediately blocks the pharmacy from all paid features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subsQuery.isError ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm text-destructive">
                    {subsQuery.error instanceof Error
                      ? subsQuery.error.message
                      : 'Could not load subscribers.'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => void subsQuery.refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <AdminSubscribersTable
                  rows={subscribers}
                  actionLoadingId={actionLoadingId}
                  onSuspend={row => void handleSuspend(row)}
                  onReactivate={row => void handleReactivate(row)}
                  pageSize={12}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Transactions tab ── */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All payment transactions</CardTitle>
              <CardDescription>
                KPay Mobile Money and Polar card checkouts for subscription upgrades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={transactions} pageSize={10} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invoices tab ── */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription invoices</CardTitle>
              <CardDescription>
                Combined monthly invoices generated for all pharmacies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesQuery.isError ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm text-destructive">Could not load invoices.</p>
                  <Button variant="outline" size="sm" onClick={() => void invoicesQuery.refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : invoicesQuery.isPending ? (
                <div className="flex justify-center py-8">
                  <Spinner className="size-5" />
                </div>
              ) : (
                <InvoicesTable invoices={invoices} pageSize={10} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Legacy records tab ── */}
        <TabsContent value="legacy" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Legacy subscription records</CardTitle>
              <CardDescription>
                Rows from the old subscriptions table shape (pre-SaaS migration).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionsTable subscriptions={legacySubscriptions} pageSize={10} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
