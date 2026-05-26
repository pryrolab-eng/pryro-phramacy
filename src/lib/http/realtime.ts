import { fetchJson } from "./client";

export const realtimeKeys = {
  all: ["realtime"] as const,
  updates: () => [...realtimeKeys.all, "updates"] as const,
};

export type RealtimeUpdate = {
  type:
    | "inventory_update"
    | "new_sale"
    | "stock_alert"
    | "prescription_update"
    | string;
  data: unknown;
};

export async function getRealtimeUpdates(): Promise<RealtimeUpdate[]> {
  try {
    const data = await fetchJson<RealtimeUpdate[]>("/api/realtime/updates");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
