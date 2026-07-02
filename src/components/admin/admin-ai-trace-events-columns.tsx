"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle, AlertTriangle, Bot, BarChart3 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { cn } from "@/lib/utils";
import type { AiTraceEventRow } from "@/lib/http/admin/ai-trace-events";

function FeatureChip({ feature }: { feature: string }) {
  const isDrugSafety = feature === "drug_safety";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        isDrugSafety
          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      )}
    >
      {isDrugSafety ? (
        <Bot className="h-3 w-3" />
      ) : (
        <BarChart3 className="h-3 w-3" />
      )}
      {feature}
    </span>
  );
}

function StatusChip({
  success,
  fallback,
}: {
  success: boolean;
  fallback: boolean;
}) {
  if (!success) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  if (fallback) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <AlertTriangle className="h-3 w-3" />
        Local rules
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
      <CheckCircle2 className="h-3 w-3" />
      AI success
    </span>
  );
}

function TokenDisplay({ input, output }: { input: number; output: number }) {
  const total = input + output;
  return (
    <span className="font-mono text-xs">
      <span className="text-muted-foreground">{input.toLocaleString()}</span>
      {" / "}
      <span className="text-muted-foreground">{output.toLocaleString()}</span>
      {" = "}
      <span className="font-medium">{total.toLocaleString()}</span>
    </span>
  );
}

export function createAdminAiTraceEventsColumns(): ColumnDef<AiTraceEventRow>[] {
  return [
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "trace_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trace ID" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.trace_id.slice(0, 8)}…
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "feature",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Feature" />
      ),
      cell: ({ row }) => <FeatureChip feature={row.original.feature} />,
      enableSorting: true,
    },
    {
      accessorKey: "model",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Model" />
      ),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-mono text-xs">
          {row.original.model}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "input_tokens",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tokens (in/out)" />
      ),
      cell: ({ row }) => (
        <TokenDisplay
          input={row.original.input_tokens}
          output={row.original.output_tokens}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "latency_ms",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Latency" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.latency_ms > 0
            ? `${row.original.latency_ms}ms`
            : "—"}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "success",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <StatusChip
          success={row.original.success}
          fallback={row.original.fallback}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "error",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Error" />
      ),
      cell: ({ row }) =>
        row.original.error ? (
          <span
            className="max-w-[200px] truncate text-xs text-red-600 dark:text-red-400"
            title={row.original.error ?? undefined}
          >
            {row.original.error}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      enableSorting: false,
    },
  ];
}