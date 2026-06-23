import { ApiError, fetchJson } from "./client";

export type ActivityLogItem = {
  id: string;
  action: string;
  tableName: string | null;
  recordId: string | null;
  userId: string | null;
  userLabel: string;
  createdAt: string;
  summary: string;
};

export type ActivityLogsResponse = {
  items: ActivityLogItem[];
  limit: number;
  offset: number;
};

export const activityLogsKeys = {
  all: ["pharmacy", "activity-logs"] as const,
  list: (offset: number, limit: number) =>
    [...activityLogsKeys.all, offset, limit] as const,
};

export async function getActivityLogs(
  offset = 0,
  limit = 50,
): Promise<ActivityLogsResponse> {
  try {
    return await fetchJson<ActivityLogsResponse>(
      `/api/pharmacy/activity-logs?offset=${offset}&limit=${limit}`,
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 403 &&
      error.message === "audit_logs_disabled"
    ) {
      throw error;
    }
    return { items: [], limit, offset };
  }
}
