"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock, Zap, BarChart3 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { createAdminAiTraceEventsColumns } from "@/components/admin/admin-ai-trace-events-columns";
import {
  DashboardDataTable,
  DashboardMetricGrid,
  DashboardPageLoading,
  DashboardStatCard,
} from "@/components/dashboard";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminAiTraceEvents,
  type AiTraceEventsFilters,
} from "@/hooks/useAdminAiTraceEvents";

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Bot className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
      <p className="text-sm font-medium text-neutral-500">No AI trace events yet</p>
      <p className="mt-1 text-xs text-neutral-400">
        Events appear here after pharmacies use drug safety checks or analytics.
      </p>
    </div>
  );
}

export function AdminAiTraceEventsPanel() {
  const [filters, setFilters] = useState<AiTraceEventsFilters>({
    page: 1,
    pageSize: 100,
  });

  const query = useAdminAiTraceEvents(filters);
  const data = query.data;

  const columns = useMemo(() => createAdminAiTraceEventsColumns(), []);

  const rows = useMemo(() => data?.events ?? [], [data]);

  const summary = data?.summary;

  const isLoading = query.isFetching && rows.length === 0;
  const isEmpty = !isLoading && rows.length === 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Audit Logs"
        description="Observability and audit trail for AI drug safety and analytics calls. Tracks NVIDIA Nemotron usage, local rule fallbacks, and errors."
      />

      <DashboardMetricGrid className="lg:grid-cols-4">
        <DashboardStatCard
          label="Total AI calls"
          icon={Zap}
          value={summary?.totalCalls ?? 0}
          hint="All drug safety + analytics"
        />
        <DashboardStatCard
          label="Success rate"
          icon={CheckCircle2}
          value={summary ? `${summary.successRate}%` : "—"}
          hint={
            summary
              ? `${summary.successCount} AI · ${summary.fallbackCount} local rules`
              : undefined
          }
        />
        <DashboardStatCard
          label="Avg latency"
          icon={Clock}
          value={summary ? `${summary.avgLatencyMs}ms` : "—"}
          hint="Per call (AI + network)"
        />
        <DashboardStatCard
          label="Total tokens"
          icon={BarChart3}
          value={
            summary
              ? `${((summary.totalInputTokens + summary.totalOutputTokens) / 1000).toFixed(1)}K`
              : "—"
          }
          hint={`in: ${summary?.totalInputTokens.toLocaleString() ?? 0} · out: ${summary?.totalOutputTokens.toLocaleString() ?? 0}`}
        />
      </DashboardMetricGrid>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        </div>

        <Select
          value={filters.feature ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              feature: v === "all" ? undefined : v,
              page: 1,
            }))
          }
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Feature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All features</SelectItem>
            <SelectItem value="drug_safety">Drug safety</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={
            filters.success === "true"
              ? "success"
              : filters.success === "false"
                ? "failed"
                : "all"
          }
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              success: v === "all" ? undefined : v,
              page: 1,
            }))
          }
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">AI success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">From:</span>
          <input
            type="date"
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            value={filters.from ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                from: e.target.value || undefined,
                page: 1,
              }))
            }
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">To:</span>
          <input
            type="date"
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            value={filters.to ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                to: e.target.value || undefined,
                page: 1,
              }))
            }
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <DashboardDataTable
          title="AI trace events"
          searchPlaceholder="Search by trace ID or model…"
          columns={columns}
          data={rows}
          pageSize={50}
          pageSizeOptions={[25, 50, 100]}
          stickyHeader
          initialSorting={[{ id: "created_at", desc: true }]}
          emptyMessage="No events match the current filters."
          isLoading={query.isFetching}
        />
      )}
    </div>
  );
}