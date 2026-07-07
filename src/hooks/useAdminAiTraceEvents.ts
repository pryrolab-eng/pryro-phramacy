import { useQuery } from "@tanstack/react-query";
import {
  adminAiTraceEventsQueryKey,
  getAdminAiTraceEvents,
  type AiTraceEventsFilters,
} from "@/lib/http/admin/ai-trace-events";

export type { AiTraceEventsFilters };

export function useAdminAiTraceEvents(filters: AiTraceEventsFilters = {}) {
  return useQuery({
    queryKey: adminAiTraceEventsQueryKey,
    queryFn: () => getAdminAiTraceEvents(filters),
  });
}