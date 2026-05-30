"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { AdminBillingReconciliationRow } from "@/lib/http/admin/billing";

const kindLabels: Record<AdminBillingReconciliationRow["kind"], string> = {
  orphan_payment: "Orphan payment",
  pending_main: "Pending payment",
  missing_plan_id: "Missing plan_id",
};

type ReconColumnOptions = {
  onCancel: (row: AdminBillingReconciliationRow) => void;
  cancellingId: string | null;
};

export function adminBillingReconciliationColumns(
  opts: ReconColumnOptions,
): ColumnDef<AdminBillingReconciliationRow>[] {
  return [
    {
      accessorKey: "kind",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{kindLabels[row.original.kind]}</Badge>
      ),
    },
    {
      accessorKey: "pharmacy_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pharmacy" />
      ),
      cell: ({ row }) => row.original.pharmacy_name ?? "—",
    },
    {
      accessorKey: "detail",
      header: "Detail",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.detail}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const item = row.original;
        if (!item.can_cancel) {
          return (
            <span className="text-xs text-muted-foreground">—</span>
          );
        }
        const busy = opts.cancellingId === item.id;
        return (
          <DashboardButton
            tone="outline"
            size="sm"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              opts.onCancel(item);
            }}
          >
            {busy ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="mr-1 h-3.5 w-3.5" strokeWidth={1.75} />
            )}
            Cancel
          </DashboardButton>
        );
      },
      meta: { className: "text-right" },
    },
  ];
}
