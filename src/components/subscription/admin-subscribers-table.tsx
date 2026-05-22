'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldOff,
  ShieldCheck,
  Loader2,
  Search,
} from 'lucide-react'
import { TablePagination } from './table-pagination'
import { useTablePagination } from './use-table-pagination'
import type { AdminSubscriberRow } from '@/lib/http/admin/subscriptions'

// ─── Types ────────────────────────────────────────────────

type SortKey =
  | 'pharmacy'
  | 'plan'
  | 'status'
  | 'billing_period'
  | 'current_period_end'
  | 'created_at'

type SortDir = 'asc' | 'desc'

interface AdminSubscribersTableProps {
  rows: AdminSubscriberRow[]
  actionLoadingId?: string | null
  onSuspend?: (row: AdminSubscriberRow) => void
  onReactivate?: (row: AdminSubscriberRow) => void
  pageSize?: number
}

// ─── Helpers ──────────────────────────────────────────────

function statusVariant(status: string) {
  switch (status) {
    case 'active':    return 'default' as const
    case 'cancelled': return 'destructive' as const
    case 'expired':   return 'destructive' as const
    case 'past_due':  return 'secondary' as const
    case 'pending':   return 'outline' as const
    default:          return 'outline' as const
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />
  return sortDir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1" />
}

// ─── Component ────────────────────────────────────────────

export function AdminSubscribersTable({
  rows,
  actionLoadingId = null,
  onSuspend,
  onReactivate,
  pageSize = 10,
}: AdminSubscribersTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [confirmRow, setConfirmRow] = useState<AdminSubscriberRow | null>(null)
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'reactivate'>('suspend')

  // ── Filter ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter(r => {
      const matchSearch =
        !q ||
        (r.pharmacy?.name ?? '').toLowerCase().includes(q) ||
        (r.pharmacy?.email ?? '').toLowerCase().includes(q) ||
        (r.plan?.name ?? '').toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rows, search, statusFilter])

  // ── Sort ────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      switch (sortKey) {
        case 'pharmacy':
          av = a.pharmacy?.name ?? ''
          bv = b.pharmacy?.name ?? ''
          break
        case 'plan':
          av = a.plan?.name ?? ''
          bv = b.plan?.name ?? ''
          break
        case 'status':
          av = a.status
          bv = b.status
          break
        case 'billing_period':
          av = a.billing_period
          bv = b.billing_period
          break
        case 'current_period_end':
          av = a.current_period_end ?? ''
          bv = b.current_period_end ?? ''
          break
        case 'created_at':
          av = a.created_at
          bv = b.created_at
          break
      }
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const pagination = useTablePagination(sorted, { pageSize })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    pagination.setPage(1)
  }

  const handleConfirm = () => {
    if (!confirmRow) return
    if (confirmAction === 'suspend') onSuspend?.(confirmRow)
    else onReactivate?.(confirmRow)
    setConfirmRow(null)
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No subscription records found.
      </p>
    )
  }

  const SortTh = ({
    col,
    children,
    className,
  }: {
    col: SortKey
    children: React.ReactNode
    className?: string
  }) => (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap ${className ?? ''}`}
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center">
        {children}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </TableHead>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search pharmacy or plan…"
            value={search}
            onChange={e => { setSearch(e.target.value); pagination.setPage(1) }}
            className="pl-8 h-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={v => { setStatusFilter(v); pagination.setPage(1) }}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="past_due">Past due</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortTh col="pharmacy">Pharmacy</SortTh>
              <SortTh col="plan">Plan</SortTh>
              <SortTh col="status">Status</SortTh>
              <SortTh col="billing_period">Billing</SortTh>
              <SortTh col="current_period_end">Renews / Ends</SortTh>
              <SortTh col="created_at">Subscribed</SortTh>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.map(row => {
              const isLoading = actionLoadingId === row.id
              const canSuspend = row.status === 'active' || row.status === 'past_due'
              const canReactivate = row.status === 'cancelled' || row.status === 'expired'

              return (
                <TableRow key={row.id} className={!row.is_active ? 'opacity-60' : ''}>
                  {/* Pharmacy */}
                  <TableCell>
                    <p className="font-medium text-sm leading-tight">
                      {row.pharmacy?.name ?? <span className="text-muted-foreground">—</span>}
                    </p>
                    {row.pharmacy?.email && (
                      <p className="text-xs text-muted-foreground">{row.pharmacy.email}</p>
                    )}
                  </TableCell>

                  {/* Plan */}
                  <TableCell>
                    <p className="font-medium text-sm">
                      {row.plan?.name ?? <span className="text-muted-foreground">—</span>}
                    </p>
                    {row.plan?.price != null && (
                      <p className="text-xs text-muted-foreground">
                        {row.plan.price === 0
                          ? 'Free'
                          : `RWF ${Number(row.plan.price).toLocaleString()}`}
                        {row.plan.price > 0 && ` / ${row.plan.billing_period}`}
                      </p>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={statusVariant(row.status)} className="capitalize">
                      {row.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>

                  {/* Billing period */}
                  <TableCell className="capitalize text-sm">
                    {row.billing_period}
                  </TableCell>

                  {/* Period end */}
                  <TableCell className="text-sm whitespace-nowrap">
                    {fmtDate(row.current_period_end)}
                  </TableCell>

                  {/* Subscribed at */}
                  <TableCell className="text-sm whitespace-nowrap">
                    {fmtDate(row.created_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    ) : canSuspend ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          setConfirmRow(row)
                          setConfirmAction('suspend')
                        }}
                      >
                        <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                        Revoke
                      </Button>
                    ) : canReactivate ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                        onClick={() => {
                          setConfirmRow(row)
                          setConfirmAction('reactivate')
                        }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                        Reactivate
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmRow} onOpenChange={o => !o && setConfirmRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'suspend' ? 'Revoke subscription?' : 'Reactivate subscription?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'suspend' ? (
                <>
                  This will immediately cancel{' '}
                  <strong>{confirmRow?.pharmacy?.name ?? 'this pharmacy'}</strong>&apos;s subscription
                  and suspend their account. They will lose access to all paid features instantly.
                </>
              ) : (
                <>
                  This will reactivate{' '}
                  <strong>{confirmRow?.pharmacy?.name ?? 'this pharmacy'}</strong>&apos;s subscription
                  and restore their access for one more month.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction === 'suspend'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
              onClick={handleConfirm}
            >
              {confirmAction === 'suspend' ? 'Yes, revoke access' : 'Yes, reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
