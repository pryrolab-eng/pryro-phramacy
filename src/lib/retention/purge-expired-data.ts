import { prisma } from "@/lib/db/prisma";
import { getDataRetentionDays } from "@/lib/platform-settings";

export async function purgeExpiredPlatformData(): Promise<{
  retentionDays: number;
  auditLogsDeleted: number;
  webhookDeliveriesDeleted: number;
  rateLimitBucketsDeleted: number;
}> {
  const retentionDays = await getDataRetentionDays();
  if (retentionDays <= 0) {
    return {
      retentionDays: 0,
      auditLogsDeleted: 0,
      webhookDeliveriesDeleted: 0,
      rateLimitBucketsDeleted: 0,
    };
  }

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const [auditLogs, webhookDeliveries, rateLimitBuckets] = await Promise.all([
    prisma.audit_logs.deleteMany({
      where: { created_at: { lt: cutoff } },
    }),
    prisma.integration_webhook_deliveries.deleteMany({
      where: {
        created_at: { lt: cutoff },
        status: { in: ["delivered", "failed"] },
      },
    }),
    prisma.rate_limit_buckets.deleteMany({
      where: { updated_at: { lt: cutoff } },
    }),
  ]);

  return {
    retentionDays,
    auditLogsDeleted: auditLogs.count,
    webhookDeliveriesDeleted: webhookDeliveries.count,
    rateLimitBucketsDeleted: rateLimitBuckets.count,
  };
}
