'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Loader2, RefreshCw, Receipt } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useAdminTransactions } from '@/hooks/useAdminTransactions'
import { fetchJson } from '@/lib/http/client'
import { TransactionsTable, SubscriptionsTable } from '@/components/subscription'

export default function AdminBillingPage() {
  const query = useAdminTransactions()
  const [backfilling, setBackfilling] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null)

  const transactions = query.data?.transactions ?? []
  const subscriptions = query.data?.subscriptions ?? []

  const completedTotal = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0)

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
      await query.refetch()
    } catch (e) {
      setBackfillMsg(e instanceof Error ? e.message : 'Backfill failed')
    } finally {
      setBackfilling(false)
    }
  }

  if (query.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-destructive" role="alert">
          {query.error instanceof Error
            ? query.error.message
            : 'Could not load billing data.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-8 w-8 text-blue-600" />
            Billing &amp; Transactions
          </h1>
          <p className="text-gray-600 mt-1">
            Track subscription payments (KPay and Polar) and pharmacy subscriptions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${query.isFetching ? 'animate-spin' : ''}`}
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
            Sync invoices from payments
          </Button>
        </div>
      </div>

      {backfillMsg ? (
        <p className="mb-4 text-sm text-muted-foreground rounded-md border px-3 py-2 bg-muted/40">
          {backfillMsg}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3 mb-8">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {subscriptions.filter((s) => s.is_active).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Payment transactions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

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

        <TabsContent value="subscriptions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription records</CardTitle>
              <CardDescription>
                Rows in the subscriptions table (active and historical).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionsTable subscriptions={subscriptions} pageSize={10} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
