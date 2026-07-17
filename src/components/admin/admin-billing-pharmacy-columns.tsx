"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { Badge, badgeVariantFromTone } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  pharmacyAccessLabel,
} from "@/lib/admin/plan-stats";
import type { AdminBillingPharmacyRow } from "@/lib/http/admin/billing";
import {
  pharmacyAccessTone,
  statusToneTextClass,
  subscriptionStatusTone,
} from "@/lib/ui/status-tone";
import { cn } from "@/lib/utils";

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
        const billingStatus = row.original.main_billing_status ?? "—";
        const statusTone = subscriptionStatusTone(
          billingStatus === "—" ? "active" : billingStatus,
        );

        if (row.original.pending_plan_name) {
          return (
            <div className="space-y-1">
              <Badge
                variant={badgeVariantFromTone(statusTone)}
                className="capitalize"
              >
                {billingStatus === "—" ? "Active" : billingStatus}
              </Badge>
              <p className={cn("text-xs", statusToneTextClass.warning)}>
                Pending: {row.original.pending_plan_name}
              </p>
            </div>
          );
        }
        return (
          <Badge
            variant={badgeVariantFromTone(
              subscriptionStatusTone(
                billingStatus === "—" ? null : billingStatus,
              ),
            )}
            className="capitalize"
          >
            {billingStatus}
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
        <Badge
          variant={badgeVariantFromTone(
            pharmacyAccessTone(row.original.access_status),
          )}
        >
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
