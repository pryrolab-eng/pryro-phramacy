/**
 * Seed demo pharmacy data for the logged-in user's pharmacy.
 *
 * Usage:
 *   npx tsx scripts/seed-pharmacy-demo.ts --email you@example.com
 *   npx tsx scripts/seed-pharmacy-demo.ts --pharmacy-id <uuid>
 *
 * Requires DATABASE_URL in .env (loads via dotenv).
 */
import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { seedPharmacyDemo } from "@/lib/seed/seed-pharmacy-demo";

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function resolvePharmacyId(): Promise<string> {
  const pharmacyId = readArg("--pharmacy-id");
  if (pharmacyId) return pharmacyId;

  const email = readArg("--email");
  if (!email) {
    throw new Error("Pass --pharmacy-id <uuid> or --email <user@example.com>");
  }

  const user = await prisma.public_users.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) throw new Error(`No user found for email ${email}`);

  const membership = await prisma.pharmacy_users.findFirst({
    where: { user_id: user.id, is_active: { not: false } },
    orderBy: { created_at: "asc" },
    select: { pharmacy_id: true },
  });
  if (!membership?.pharmacy_id) {
    throw new Error(`User ${email} has no active pharmacy membership`);
  }

  return membership.pharmacy_id;
}

async function main() {
  const pharmacyId = await resolvePharmacyId();
  const result = await seedPharmacyDemo(pharmacyId);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
