'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Loader2, RefreshCw, Receipt, Users } from 'lucide-react'
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
import { TransactionsTable, SubscriptionsTable, AdminSubscribersTable } from '@/components/subscription'

export default function AdminBillingPage() {
  const txQuery = useAdminTransactions()
  const subsQuery = useAdminSubscriptions()
  const suspendMutation = useSuspendSubscription()
  const reactivateMutation = useReactivateSubscription()

  const [backfilling, setBackfilling] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const transactions = txQuery.data?.transactions ?? []
  const legacySubscriptions = txQuery.data?.subscriptions ?? []
  const subscribers = subsQuery.data ?? []

  const completedTotal = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0)

  const activeCount = subscribers.filter(s => s.status === 'active').length

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

  if (txQuery.isPending || subsQuery.isPending) {
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-8 w-8 text-blue-600" />
            Billing &amp; Subscriptions
          </h1>
          <p className="text-gray-600 mt-1">
            Track payments, manage pharmacy subscriptions, and control access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              void txQuery.refetch()
              void subsQuery.refetch()
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

      {backfillMsg ? (
        <p className="mb-4 text-sm text-muted-foreground rounded-md border px-3 py-2 bg-muted/40">
          {backfillMsg}
        </p>
      ) : null}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subscribers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {transactions.filter((t) => t.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center gap-1">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              {completedTotal.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Mixed currencies (RWF / USD)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="transactions">Payment transactions</TabsTrigger>
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
                  onSuspend={(row) => void handleSuspend(row)}
                  onReactivate={(row) => void handleReactivate(row)}
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
