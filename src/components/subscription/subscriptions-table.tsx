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

// ─── Types ────────────────────────────────────────────────

export interface SubscriptionRow {
  id: string
  plan?: string | null
  pharmacy_id: string
  is_active: boolean
  expires_at?: string | null
  payment_method?: string | null
}

// ─── Props ────────────────────────────────────────────────

interface SubscriptionsTableProps {
  subscriptions: SubscriptionRow[]
  pageSize?: number
}

/**
 * Reusable paginated table for subscription records.
 * Used in the admin billing page.
 */
export function SubscriptionsTable({
  subscriptions,
  pageSize = 10,
}: SubscriptionsTableProps) {
  const pagination = useTablePagination(subscriptions, { pageSize })

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No subscriptions yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
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
            {pagination.paginatedData.map((sub) => (
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
