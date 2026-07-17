import {
  closeClickHouse,
  pingClickHouse,
  getClickHouseConfig,
} from "../src/lib/clickhouse/client";

async function main() {
  process.env.CLICKHOUSE_URL ??= "http://localhost:8123";
  const cfg = getClickHouseConfig();
  console.log("Checking", cfg.url, "db=", cfg.database, "user=", cfg.username);

  const result = await pingClickHouse();
  if (!result.ok) {
    console.error("FAIL:", result.error);
    process.exit(1);
  }
  console.log("OK — ClickHouse", result.version);
  await closeClickHouse();
}

main().catch(async (err) => {
  console.error(err);
  await closeClickHouse();
  process.exit(1);
});
