"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { auditTableLabel } from "@/lib/audit/format-activity-log";
import type { ActivityLogItem } from "@/lib/http/activity-logs";

function actionVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (action === "DELETE") return "destructive";
  if (action === "INSERT") return "default";
  return "secondary";
}

function formatLogTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function createActivityLogColumns(): ColumnDef<ActivityLogItem>[] {
  return [
    {
      accessorKey: "summary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event" />
      ),
      cell: ({ row }) => (
        <span className="line-clamp-2 font-medium">{row.original.summary}</span>
      ),
      meta: { className: "max-w-[280px]" },
    },
    {
      accessorKey: "userLabel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.userLabel}</span>
      ),
    },
    {
      id: "module",
      accessorFn: (row) => auditTableLabel(row.tableName),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Module" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {auditTableLabel(row.original.tableName)}
        </span>
      ),
      meta: { className: "hidden lg:table-cell" },
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => (
        <Badge variant={actionVariant(row.original.action)}>
          {row.original.action}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="When" className="justify-end" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
          {formatLogTime(row.original.createdAt)}
        </span>
      ),
      meta: { className: "text-right" },
    },
  ];
}
