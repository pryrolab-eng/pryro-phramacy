"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  pharmacyAccessLabel,
  pharmacyAccessVariant,
} from "@/lib/admin/plan-stats";
import type { AdminBillingPharmacyRow } from "@/lib/http/admin/billing";

export function adminBillingPharmacyColumns(): ColumnDef<AdminBillingPharmacyRow>[] {
  return [
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
      accessorKey: "main_plan_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Main plan" />
      ),
      cell: ({ row }) => (
        <span className="font-medium capitalize">
          {row.original.main_plan_name ?? "—"}
        </span>
      ),
    },
    {
      id: "billing",
      header: "Billing status",
      cell: ({ row }) => {
        if (row.original.pending_plan_name) {
          return (
            <div className="space-y-1">
              <Badge variant="secondary">
                {row.original.main_billing_status ?? "Active"}
              </Badge>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Pending: {row.original.pending_plan_name}
              </p>
            </div>
          );
        }
        return (
          <Badge variant="outline">
            {row.original.main_billing_status ?? "—"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "access_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Access" />
      ),
      cell: ({ row }) => (
        <Badge variant={pharmacyAccessVariant(row.original.access_status)}>
          {pharmacyAccessLabel(row.original.access_status)}
        </Badge>
      ),
    },
    {
      accessorKey: "branch_addons_active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Branch add-ons" />
      ),
      cell: ({ row }) => row.original.branch_addons_active,
    },
    {
      accessorKey: "expires_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expires" />
      ),
      cell: ({ row }) =>
        row.original.expires_at
          ? new Date(row.original.expires_at).toLocaleDateString()
          : "—",
    },
  ];
}
