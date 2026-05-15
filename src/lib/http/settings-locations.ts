import { ensureApiSuccess, fetchJson } from "./client";

export const stockLocationsQueryKey = ["settings", "locations"] as const;

export type StockLocationRow = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export async function getStockLocations(): Promise<StockLocationRow[]> {
  const data = await fetchJson<unknown>("/api/settings/locations");
  return Array.isArray(data) ? (data as StockLocationRow[]) : [];
}

export type CreateStockLocationInput = {
  name: string;
  description?: string;
};

export async function createStockLocation(
  body: CreateStockLocationInput,
): Promise<void> {
  const data = await fetchJson<{ success: boolean; error?: string }>(
    "/api/settings/locations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  ensureApiSuccess(data, "Failed to add location");
}
