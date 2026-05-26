"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getRealtimeUpdates,
  realtimeKeys,
  type RealtimeUpdate,
} from "@/lib/http/realtime";

export type { RealtimeUpdate } from "@/lib/http/realtime";

export function useRealtimeUpdates(onUpdate: (update: RealtimeUpdate) => void) {
  const query = useQuery({
    queryKey: realtimeKeys.updates(),
    queryFn: getRealtimeUpdates,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const updates = query.data ?? [];
    updates.forEach(onUpdate);
  }, [query.data, onUpdate]);

  return { connected: query.isSuccess && !query.isError };
}
