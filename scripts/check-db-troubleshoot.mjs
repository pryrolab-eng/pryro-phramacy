import { PrismaClient } from "@prisma/client";

// Use transaction pooler (port 6543) for checks — no 15-connection limit
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

try {
  const indexes = await prisma.$queryRawUnsafe(
    `SELECT tablename, indexname, indexdef
     FROM pg_indexes
     WHERE tablename IN ('inventory', 'sales')
     AND indexname IN ('idx_inventory_pharmacy_updated_at', 'idx_sales_pharmacy_created_at')
     ORDER BY tablename, indexname`
  );
  console.log("Indexes:", JSON.stringify(indexes, null, 2));

  const sizes = await prisma.$queryRawUnsafe(
    `SELECT relname, n_live_tup::int as estimated_rows
     FROM pg_stat_user_tables
     WHERE relname IN ('inventory', 'sales', 'customers', 'sale_items', 'medications')
     ORDER BY estimated_rows DESC`
  );
  console.log("Table sizes:", JSON.stringify(sizes, null, 2));
} catch (err) {
  console.error("Failed:", err.message);
} finally {
  await prisma.$disconnect();
}
