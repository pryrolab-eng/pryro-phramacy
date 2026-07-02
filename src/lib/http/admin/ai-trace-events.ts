import { fetchJson } from "../client";

export const adminAiTraceEventsQueryKey = ["admin", "ai-trace-events"] as const;

export type AiTraceEventRow = {
  id: string;
  trace_id: string;
  tenant_id: string | null;
  feature: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  success: boolean;
  fallback: boolean;
  error: string | null;
  created_at: string;
};

export type AiTraceEventsSummary = {
  totalCalls: number;
  successCount: number;
  fallbackCount: number;
  successRate: number;
  avgLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
};

export type AiTraceEventsResponse = {
  events: AiTraceEventRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: AiTraceEventsSummary;
};

export type AiTraceEventsFilters = {
  page?: number;
  pageSize?: number;
  pharmacyId?: string;
  feature?: string;
  success?: string;
  from?: string;
  to?: string;
};

export async function getAdminAiTraceEvents(
  filters: AiTraceEventsFilters = {},
): Promise<AiTraceEventsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.pharmacyId) params.set("pharmacyId", filters.pharmacyId);
  if (filters.feature) params.set("feature", filters.feature);
  if (filters.success) params.set("success", filters.success);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const query = params.toString();
  return fetchJson<AiTraceEventsResponse>(
    `/api/admin/ai-trace-events${query ? `?${query}` : ""}`,
    { credentials: "include", cache: "no-store" },
  );
}