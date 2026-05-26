"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

export type PlanBreakdownRow = {
  plan_name: string;
  subscribers: number;
  revenue: number;
  sharePct: number;
};

function formatRwf(amount: number): string {
  if (amount >= 1_000_000) return `RWF ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `RWF ${Math.round(amount / 1_000)}K`;
  return `RWF ${amount.toLocaleString()}`;
}

export function adminReportsPlanColumns(): ColumnDef<PlanBreakdownRow>[] {
  return [
    {
      accessorKey: "plan_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Plan" />
      ),
      cell: ({ row }) => (
        <span className="font-medium capitalize">{row.original.plan_name}</span>
      ),
    },
    {
      accessorKey: "subscribers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subscribers" />
      ),
      cell: ({ row }) => row.original.subscribers.toLocaleString(),
    },
    {
      accessorKey: "revenue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Est. MRR" />
      ),
      cell: ({ row }) => formatRwf(row.original.revenue),
    },
    {
      accessorKey: "sharePct",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Share" />
      ),
      cell: ({ row }) => `${row.original.sharePct}%`,
    },
  ];
}
