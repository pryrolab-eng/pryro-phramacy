'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TablePagination } from './table-pagination'
import { useTablePagination } from './use-table-pagination'
import type { AdminPaymentTransactionRow } from '@/lib/http/admin/transactions'

// ─── Helpers ──────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────

interface TransactionsTableProps {
  transactions: AdminPaymentTransactionRow[]
  pageSize?: number
}

/**
 * Reusable paginated table for payment transactions.
 * Used in the admin billing page.
 */
export function TransactionsTable({
  transactions,
  pageSize = 10,
}: TransactionsTableProps) {
  const pagination = useTablePagination(transactions, { pageSize })

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No transactions yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
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
            {pagination.paginatedData.map((tx) => {
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
      </div>

      <TablePagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
      />
    </div>
  )
}
