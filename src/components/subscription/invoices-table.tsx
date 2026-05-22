'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Receipt, FileText } from 'lucide-react'
import { TablePagination } from './table-pagination'
import { useTablePagination } from './use-table-pagination'
import type { SubscriptionInvoice } from '@/lib/saas/types'

// ─── Helpers ──────────────────────────────────────────────

function statusVariant(status: string) {
  if (status === 'paid') return 'default' as const
  if (status === 'overdue') return 'destructive' as const
  if (status === 'void') return 'secondary' as const
  return 'outline' as const
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function fmtAmount(n: number) {
  return `RWF ${Number(n).toLocaleString()}`
}

// ─── Invoice detail dialog ─────────────────────────────────

function InvoiceDetailDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: SubscriptionInvoice
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Billing month</p>
              <p className="font-medium">{invoice.billing_month}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={statusVariant(invoice.status)} className="mt-0.5 capitalize">
                {invoice.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="font-medium">{fmtDate(invoice.due_date)}</p>
            </div>
            {invoice.paid_at && (
              <div>
                <p className="text-xs text-muted-foreground">Paid on</p>
                <p className="font-medium">{fmtDate(invoice.paid_at)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Line items */}
          {invoice.lines && invoice.lines.length > 0 ? (
            <div className="space-y-2">
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                Line items
              </p>
              {invoice.lines.map(line => (
                <div key={line.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <span className="text-sm">{line.description}</span>
                  <span className="font-medium tabular-nums">{fmtAmount(line.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No line items recorded.</p>
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmtAmount(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{fmtAmount(invoice.total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <p className="text-xs text-muted-foreground border-t pt-3">{invoice.notes}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ────────────────────────────────────────

interface InvoicesTableProps {
  invoices: SubscriptionInvoice[]
  pageSize?: number
  /** Show a compact card-style list instead of a table (default: false) */
  cardView?: boolean
}

/**
 * Reusable paginated invoices table with detail dialog.
 * Used in both the pharmacy billing page and admin billing page.
 */
export function InvoicesTable({
  invoices,
  pageSize = 8,
  cardView = false,
}: InvoicesTableProps) {
  const [selected, setSelected] = useState<SubscriptionInvoice | null>(null)
  const pagination = useTablePagination(invoices, { pageSize })

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <FileText className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
        <p className="text-xs text-muted-foreground">
          Invoices are generated automatically each billing cycle.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cardView ? (
        /* ── Card list view ── */
        <div className="space-y-3">
          {pagination.paginatedData.map(inv => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{inv.invoice_number}</span>
                  <Badge variant={statusVariant(inv.status)} className="capitalize text-xs">
                    {inv.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {inv.billing_month} · Due {fmtDate(inv.due_date)}
                  {inv.paid_at ? ` · Paid ${fmtDate(inv.paid_at)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-base tabular-nums">
                  {fmtAmount(inv.total)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(inv)}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Billing month</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedData.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-sm">{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm">{inv.billing_month}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{fmtDate(inv.due_date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.status)} className="capitalize">
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtAmount(inv.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(inv)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TablePagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
      />

      {selected && (
        <InvoiceDetailDialog
          invoice={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
