import { syncSalesToClickHouse } from "../src/lib/clickhouse/sync-sales";
import { closeClickHouse } from "../src/lib/clickhouse/client";
import { prisma } from "../src/lib/db/prisma";

/**
 * Usage:
 *   npm run clickhouse:sync
 *   npm run clickhouse:sync -- --full
 *   npm run clickhouse:sync -- --pharmacy=<uuid>
 */
async function main() {
  process.env.CLICKHOUSE_URL ??= "http://localhost:8123";
  const full = process.argv.includes("--full");
  const pharmacyArg = process.argv.find((a) => a.startsWith("--pharmacy="));
  const pharmacyId = pharmacyArg?.split("=")[1];

  console.log(
    `Syncing sales → ClickHouse${full ? " (full)" : " (incremental)"}…`,
  );
  const result = await syncSalesToClickHouse({ pharmacyId, full });
  console.log(
    `Done: ${result.sales} sales, ${result.items} items, watermark=${result.watermark}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeClickHouse();
    await prisma.$disconnect();
  });
