"use client";

import { useQuery } from "@tanstack/react-query";
import {
  activityLogsKeys,
  getActivityLogs,
  type ActivityLogsResponse,
} from "@/lib/http/activity-logs";

export function useActivityLogs(options?: { offset?: number; limit?: number }) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 50;
  return useQuery({
    queryKey: activityLogsKeys.list(offset, limit),
    queryFn: () => getActivityLogs(offset, limit),
  });
}

export type { ActivityLogItem, ActivityLogsResponse } from "@/lib/http/activity-logs";
