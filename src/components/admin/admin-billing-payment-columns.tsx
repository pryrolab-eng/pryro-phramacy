"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { Badge, badgeVariantFromTone } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { AdminBillingPaymentRow } from "@/lib/http/admin/billing";
import { formatMoney } from "@/lib/platform-currency";
import { paymentStatusTone } from "@/lib/ui/status-tone";

export function adminBillingPaymentColumns(): ColumnDef<AdminBillingPaymentRow>[] {
  return [
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleString(),
    },
    {
      accessorKey: "pharmacy_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pharmacy" />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.pharmacy_name}</p>
          {row.original.pharmacy_email ? (
            <p className="text-xs text-muted-foreground">
              {row.original.pharmacy_email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) =>
        formatMoney(row.original.amount, row.original.currency),
    },
    {
      accessorKey: "payment_provider",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Provider" />
      ),
      cell: ({ row }) => (
        <span className="capitalize">
          {row.original.payment_provider ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge
          variant={badgeVariantFromTone(
            paymentStatusTone(row.original.status),
          )}
          className="capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "customer_email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) =>
        row.original.customer_email ||
        row.original.customer_name ||
        "—",
    },
  ];
}
