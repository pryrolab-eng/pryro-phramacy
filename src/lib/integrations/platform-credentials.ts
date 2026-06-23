import { prisma } from "@/lib/db/prisma";

/**
 * Outbound integration credentials (RRA, MoMo, etc.) stored as platform keys
 * (`pharmacy_id IS NULL`), managed in Admin → Settings → Integrations.
 */
export async function findPlatformIntegrationCredential(name: string) {
  return prisma.api_keys.findFirst({
    where: {
      pharmacy_id: null,
      name,
      is_active: true,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    select: { id: true, name: true, key_hash: true, key_prefix: true },
  });
}
