import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  closeClickHouse,
  getClickHouseClient,
  getClickHouseConfig,
  pingClickHouse,
} from "../src/lib/clickhouse/client";

/**
 * Apply SQL files under clickhouse/init/ (idempotent CREATE IF NOT EXISTS).
 * Usage: npx tsx scripts/clickhouse-migrate.ts
 */
async function main() {
  process.env.CLICKHOUSE_URL ??= "http://localhost:8123";

  const ping = await pingClickHouse();
  if (!ping.ok) {
    console.error("ClickHouse unreachable:", ping.error);
    console.error("Start it with: docker compose up -d clickhouse");
    process.exit(1);
  }
  console.log("Connected to ClickHouse", ping.version ?? "");

  const { database } = getClickHouseConfig();
  const ch = getClickHouseClient();
  await ch.command({ query: `CREATE DATABASE IF NOT EXISTS ${database}` });

  const dir = join(process.cwd(), "clickhouse", "init");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
  // Strip line comments, then split on semicolons
  const withoutComments = sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");

  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

    for (const statement of statements) {
      await ch.command({ query: statement });
    }
    console.log(`Applied ${file} (${statements.length} statements)`);
  }

  await closeClickHouse();
  console.log("ClickHouse schema ready.");
}

main().catch(async (err) => {
  console.error(err);
  await closeClickHouse();
  process.exit(1);
});
