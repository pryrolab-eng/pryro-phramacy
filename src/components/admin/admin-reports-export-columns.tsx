"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { ExportableReport } from "@/lib/http/admin/reports";

export function adminReportsExportColumns(): ColumnDef<ExportableReport>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Report" />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {row.original.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) =>
        row.original.category ? (
          <Badge variant="outline">{row.original.category}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "lastGenerated",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Generated" />
      ),
      cell: ({ row }) => row.original.lastGenerated ?? "—",
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Download</span>,
      cell: ({ row }) =>
        row.original.downloadUrl ? (
          <Button size="sm" variant="outline" asChild>
            <a href={row.original.downloadUrl} rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled title="No file URL yet">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        ),
      meta: { className: "text-right" },
    },
  ];
}
