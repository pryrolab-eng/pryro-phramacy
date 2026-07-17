/**
 * ClickHouse analytics client (optional).
 * When unset/unavailable, callers should fall back to Postgres.
 */

import { createClient, type ClickHouseClient } from "@clickhouse/client";

let client: ClickHouseClient | null = null;

export function isClickHouseConfigured(): boolean {
  return Boolean(process.env.CLICKHOUSE_URL?.trim());
}

export function getClickHouseConfig() {
  const url = process.env.CLICKHOUSE_URL?.trim() || "http://localhost:8123";
  const username = process.env.CLICKHOUSE_USER?.trim() || "pryrox";
  const password = process.env.CLICKHOUSE_PASSWORD ?? "pryrox_dev";
  const database =
    process.env.CLICKHOUSE_DATABASE?.trim() || "pryrox_analytics";
  return { url, username, password, database };
}

export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    const { url, username, password, database } = getClickHouseConfig();
    client = createClient({
      url,
      username,
      password,
      database,
      clickhouse_settings: {
        // Prefer final for ReplacingMergeTree reads in app queries
        // (callers can override per query).
        date_time_input_format: "best_effort",
      },
    });
  }
  return client;
}

export async function pingClickHouse(): Promise<{
  ok: boolean;
  version?: string;
  error?: string;
}> {
  if (!isClickHouseConfigured() && process.env.NODE_ENV === "production") {
    return { ok: false, error: "CLICKHOUSE_URL not set" };
  }
  try {
    const ch = getClickHouseClient();
    const result = await ch.ping();
    if (!result.success) {
      return {
        ok: false,
        error: result.error?.message ?? "ping failed",
      };
    }
    const versionResult = await ch.query({
      query: "SELECT version() AS v",
      format: "JSONEachRow",
    });
    const rows = await versionResult.json<{ v: string }>();
    return { ok: true, version: rows[0]?.v };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function closeClickHouse(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
