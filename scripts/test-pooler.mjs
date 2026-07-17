import { PrismaClient } from "@prisma/client";

const PW = "k9ZGdt.Km59bYi%24";
const BASE = "postgresql://postgres.rqhxfzscbrsndvjobbme:" + PW;

async function test(label, port, extra) {
  const url = BASE + "@aws-0-eu-west-1.pooler.supabase.com:" + port + "/postgres?sslmode=require" + extra;
  const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });
  try {
    const r = await prisma.$queryRawUnsafe("SELECT 1 as test");
    console.log(label + ": OK", JSON.stringify(r));
  } catch (e) {
    console.log(label + ": FAILED -", e.message?.slice(0, 300));
  } finally {
    await prisma.$disconnect();
  }
}

await test("Session pooler (5432)", 5432, "&connection_limit=2&pool_timeout=5");
await test("Txn pooler (6543, pgbouncer=true)", 6543, "&pgbouncer=true&connection_limit=2&pool_timeout=5");
await test("Txn pooler (6543, pgbouncer=false)", 6543, "&connection_limit=2&pool_timeout=5");
