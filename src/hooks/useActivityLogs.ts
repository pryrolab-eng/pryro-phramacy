"use client";

import { useQuery } from "@tanstack/react-query";
import {
  activityLogsKeys,
  getActivityLogs,
  type ActivityLogFilters,
  type ActivityLogsResponse,
} from "@/lib/http/activity-logs";

export function useActivityLogs(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: activityLogsKeys.list(filters),
    queryFn: () => getActivityLogs(filters),
  });
}

export { activityLogsKeys } from "@/lib/http/activity-logs";
export type {
  ActivityLogFilters,
  ActivityLogItem,
  ActivityLogsResponse,
} from "@/lib/http/activity-logs";
