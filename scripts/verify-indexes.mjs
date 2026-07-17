import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

try {
  const result = await prisma.$queryRawUnsafe(
    `SELECT indexname FROM pg_indexes
     WHERE tablename IN ('inventory', 'sales')
     AND indexname IN ('idx_inventory_pharmacy_updated_at', 'idx_sales_pharmacy_created_at')
     ORDER BY indexname`
  );
  const rows = result;
  console.log("Found indexes:", rows.length ? rows.map(r => r.indexname).join(", ") : "none");
} catch (err) {
  console.error("Failed:", err.message);
} finally {
  await prisma.$disconnect();
}
