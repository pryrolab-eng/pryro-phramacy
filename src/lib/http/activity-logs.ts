import { ApiError, fetchJson } from "./client";

export type ActivityLogItem = {
  id: string;
  action: string;
  tableName: string | null;
  recordId: string | null;
  userId: string | null;
  userLabel: string;
  createdAt: string | null;
  summary: string;
};

export type ActivityLogStats = {
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
};

export type ActivityLogFacets = {
  tables: string[];
  actions: string[];
  users: Array<{ id: string; label: string }>;
};

export type ActivityLogFilters = {
  offset?: number;
  limit?: number;
  action?: string;
  table?: string;
  userId?: string;
  q?: string;
  from?: string;
  to?: string;
  facets?: boolean;
};

export type ActivityLogsResponse = {
  items: ActivityLogItem[];
  total: number;
  limit: number;
  offset: number;
  stats: ActivityLogStats;
  facets?: ActivityLogFacets;
};

export const activityLogsKeys = {
  all: ["pharmacy", "activity-logs"] as const,
  list: (filters: ActivityLogFilters) =>
    [...activityLogsKeys.all, filters] as const,
};

function buildActivityLogsQuery(filters: ActivityLogFilters): string {
  const params = new URLSearchParams();
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 25;
  params.set("offset", String(offset));
  params.set("limit", String(limit));
  if (filters.action && filters.action !== "all") {
    params.set("action", filters.action);
  }
  if (filters.table && filters.table !== "all") {
    params.set("table", filters.table);
  }
  if (filters.userId && filters.userId !== "all") {
    params.set("userId", filters.userId);
  }
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.facets) params.set("facets", "1");
  return params.toString();
}

export async function getActivityLogs(
  filters: ActivityLogFilters = {},
): Promise<ActivityLogsResponse> {
  const query = buildActivityLogsQuery(filters);
  try {
    return await fetchJson<ActivityLogsResponse>(
      `/api/pharmacy/activity-logs?${query}`,
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 403 &&
      error.message === "audit_logs_disabled"
    ) {
      throw error;
    }
    return {
      items: [],
      total: 0,
      limit: filters.limit ?? 25,
      offset: filters.offset ?? 0,
      stats: { total: 0, inserts: 0, updates: 0, deletes: 0 },
    };
  }
}
