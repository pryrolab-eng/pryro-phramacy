import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

try {
  console.log("Creating idx_inventory_pharmacy_updated_at...");
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy_updated_at
     ON inventory (pharmacy_id, updated_at)`
  );
  console.log("OK");

  console.log("Creating idx_sales_pharmacy_created_at...");
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_sales_pharmacy_created_at
     ON sales (pharmacy_id, created_at)`
  );
  console.log("OK");

  console.log("All indexes created.");
} catch (err) {
  console.error("Failed:", err.message);
} finally {
  await prisma.$disconnect();
}
