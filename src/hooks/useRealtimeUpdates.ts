"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getRealtimeUpdates,
  realtimeKeys,
  type RealtimeUpdate,
} from "@/lib/http/realtime";

export type { RealtimeUpdate } from "@/lib/http/realtime";

export function useRealtimeUpdates(onUpdate: (update: RealtimeUpdate) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const processedCountRef = useRef(0);

  const query = useQuery({
    queryKey: realtimeKeys.updates(),
    queryFn: getRealtimeUpdates,
    refetchInterval: 90_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const updates = query.data ?? [];
    const prev = processedCountRef.current;

    if (updates.length <= prev) {
      if (updates.length < prev) {
        processedCountRef.current = 0;
      }
      return;
    }

    for (let i = prev; i < updates.length; i++) {
      onUpdateRef.current(updates[i]!);
    }
    processedCountRef.current = updates.length;
  }, [query.data]);

  return { connected: query.isSuccess && !query.isError };
}
