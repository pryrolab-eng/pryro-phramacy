'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Loader2, RefreshCw, Receipt } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useAdminTransactions } from '@/hooks/useAdminTransactions'
import { fetchJson } from '@/lib/http/client'
import type { AdminPaymentTransactionRow } from '@/lib/http/admin/transactions'

function statusVariant(status: string) {
  if (status === 'completed') return 'default' as const
  if (status === 'failed') return 'destructive' as const
  if (status === 'pending') return 'secondary' as const
  return 'outline' as const
}

function pharmacyFromTx(tx: AdminPaymentTransactionRow) {
  if (Array.isArray(tx.pharmacies)) return tx.pharmacies[0]
  return tx.pharmacies
}

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
            <CardContent className="overflow-x-auto">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No transactions yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const ph = pharmacyFromTx(tx)
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {new Date(tx.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{ph?.name ?? '-'}</p>
                            <p className="text-xs text-muted-foreground">
                              {ph?.email ?? ''}
                            </p>
                          </TableCell>
                          <TableCell>
                            {Number(tx.amount).toLocaleString()}{' '}
                            {tx.currency ?? 'RWF'}
                          </TableCell>
                          <TableCell className="capitalize">
                            {tx.payment_provider || tx.payment_method || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(tx.status)}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.customer_email || tx.customer_name || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
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
            <CardContent className="overflow-x-auto">
              {subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No subscriptions yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Pharmacy ID</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Payment method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="capitalize font-medium">
                          {sub.plan ?? '-'}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {sub.pharmacy_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                            {sub.is_active ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {sub.expires_at
                            ? new Date(sub.expires_at).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>{sub.payment_method ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
