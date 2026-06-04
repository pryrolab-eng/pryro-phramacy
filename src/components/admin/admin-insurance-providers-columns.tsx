"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { InsuranceProviderRow } from "@/lib/http/insurance";

type ColumnOptions = {
  onEdit: (row: InsuranceProviderRow) => void;
};

export function adminInsuranceProviderColumns(
  opts: ColumnOptions,
): ColumnDef<InsuranceProviderRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{String(row.original.name ?? "—")}</span>
      ),
    },
    {
      id: "coverage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Coverage %" />
      ),
      accessorFn: (row) =>
        Number(row.default_coverage_percent ?? row.coverage_percentage ?? 0),
      cell: ({ row }) => {
        const pct = Number(
          row.original.default_coverage_percent ??
            row.original.coverage_percentage ??
            0,
        );
        return `${pct}%`;
      },
    },
    {
      id: "scope",
      header: "Scope",
      accessorFn: (row) => (row.pharmacy_id ? "Pharmacy" : "Global"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.pharmacy_id ? "Pharmacy" : "Global"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => (row.is_active === false ? "Inactive" : "Active"),
      cell: ({ row }) => (
        <Badge variant={row.original.is_active === false ? "secondary" : "default"}>
          {row.original.is_active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DashboardButton
          variant="ghost"
          size="sm"
          onClick={() => opts.onEdit(row.original)}
          aria-label={`Edit ${row.original.name}`}
        >
          <Pencil className="h-4 w-4" />
        </DashboardButton>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
