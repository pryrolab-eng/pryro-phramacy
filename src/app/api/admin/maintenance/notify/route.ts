import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { writeAuditLog } from "@/lib/db/audit-logs";
import { prisma } from "@/lib/db/prisma";
import { getMaintenanceNotifyQueue } from "@/lib/queue/maintenance-notify";
import { isRedisConfigured } from "@/lib/queue/redis";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isRedisConfigured()) {
    return NextResponse.json(
      {
        error: "redis_not_configured",
        message: "Redis is not configured. Set REDIS_URL in your environment.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { message, scheduledAt } = body;

    if (!message || !scheduledAt) {
      return NextResponse.json(
        { error: "message and scheduledAt are required" },
        { status: 400 }
      );
    }

    const users = await prisma.public_users.findMany({
      select: { email: true },
      where: { email: { not: null } },
    });

    const emails = users
      .map((u) => u.email)
      .filter((e): e is string => Boolean(e));

    if (emails.length === 0) {
      return NextResponse.json({ success: true, queued: 0 });
    }

    const batchId = randomUUID();
    const queue = getMaintenanceNotifyQueue();

    const jobs = await queue.addBulk(
      emails.map((email) => ({
        name: "send-email",
        data: { email, message, scheduledAt, batchId },
        opts: { delay: 0 },
      }))
    );

    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "INSERT",
      tableName: "system_settings",
      newValues: {
        type: "maintenance_notification",
        batchId,
        queued: jobs.length,
        scheduledAt,
      },
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      batchId,
      queued: jobs.length,
    });
  } catch (error) {
    console.error("maintenance notify:", error);
    return NextResponse.json(
      { error: "Failed to queue notifications" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isRedisConfigured()) {
    return NextResponse.json({
      configured: false,
      stats: null,
      recentBatches: [],
    });
  }

  try {
    const queue = getMaintenanceNotifyQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    const recentLogs = await prisma.maintenance_notification_log.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        batch_id: true,
        email: true,
        status: true,
        error: true,
        created_at: true,
      },
    });

    const batchIds = Array.from(new Set(recentLogs.map((l) => l.batch_id)));
    const batches = batchIds.map((id) => {
      const logs = recentLogs.filter((l) => l.batch_id === id);
      return {
        batchId: id,
        sent: logs.filter((l) => l.status === "sent").length,
        failed: logs.filter((l) => l.status === "failed").length,
        total: logs.length,
        createdAt: logs[0]?.created_at,
      };
    });

    return NextResponse.json({
      configured: true,
      stats: { waiting, active, completed, failed, delayed },
      recentBatches: batches,
    });
  } catch (error) {
    console.error("maintenance notify GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification stats" },
      { status: 500 }
    );
  }
}
