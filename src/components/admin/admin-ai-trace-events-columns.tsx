"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle, AlertTriangle, Bot, BarChart3 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AiTraceEventRow } from "@/lib/http/admin/ai-trace-events";

function SimpleTooltip({ children, content }: { children: React.ReactNode; content?: string }) {
  if (!content) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top">
          <p className="max-w-[300px] text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FeatureChip({ feature }: { feature: string }) {
  const isDrugSafety = feature === "drug_safety";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium",
        isDrugSafety
          ? "bg-violet-500 text-violet-50 dark:bg-violet-400 dark:text-violet-950"
          : "bg-blue-500 text-blue-50 dark:bg-blue-400 dark:text-blue-950",
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
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-0.5 text-sm font-medium text-red-100 dark:bg-red-400 dark:text-red-950">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  if (fallback) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-sm font-medium text-amber-100 dark:bg-amber-400 dark:text-amber-950">
        <AlertTriangle className="h-3 w-3" />
        Local rules
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-sm font-medium text-emerald-100 dark:bg-emerald-400 dark:text-emerald-950 whitespace-nowrap">
      <CheckCircle2 className="h-3 w-3" />
      AI success
    </span>
  );
}

function TokenDisplay({ input, output }: { input: number; output: number }) {
  const total = input + output;
  return (
    <div className="flex items-center gap-1.5 font-mono text-sm whitespace-nowrap">
      <SimpleTooltip content="Input Tokens">
        <span className="cursor-help text-muted-foreground">{input.toLocaleString()}</span>
      </SimpleTooltip>
      <span className="text-muted-foreground/40">/</span>
      <SimpleTooltip content="Output Tokens">
        <span className="cursor-help text-muted-foreground">{output.toLocaleString()}</span>
      </SimpleTooltip>
      <span className="text-muted-foreground/40">=</span>
      <SimpleTooltip content="Total Tokens">
        <span className="cursor-help font-medium text-foreground">{total.toLocaleString()}</span>
      </SimpleTooltip>
    </div>
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
        <div className="font-mono text-sm text-muted-foreground whitespace-nowrap">
          {new Date(row.original.created_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "trace_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trace ID" />
      ),
      cell: ({ row }) => (
        <SimpleTooltip content={row.original.trace_id}>
          <div className="cursor-help font-mono text-sm text-muted-foreground">
            {row.original.trace_id.slice(0, 8)}…
          </div>
        </SimpleTooltip>
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
        <SimpleTooltip content={row.original.model}>
          <div className="cursor-help max-w-[140px] truncate font-mono text-sm text-muted-foreground">
            {row.original.model.replace("nvidia/", "")}
          </div>
        </SimpleTooltip>
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
        <div className="font-mono text-sm whitespace-nowrap">
          {row.original.latency_ms > 0
            ? `${(row.original.latency_ms / 1000).toFixed(2)}s`
            : "—"}
        </div>
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
          <SimpleTooltip content={row.original.error}>
            <div className="cursor-help max-w-[150px] truncate text-sm text-red-600 dark:text-red-400">
              {row.original.error}
            </div>
          </SimpleTooltip>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      enableSorting: false,
    },
  ];
}