import { NextRequest, NextResponse } from "next/server";
import { isClickHouseConfigured } from "@/lib/clickhouse/client";
import { syncSalesToClickHouse } from "@/lib/clickhouse/sync-sales";
import { closeClickHouse } from "@/lib/clickhouse/client";

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === secret) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

/**
 * Incremental Postgres → ClickHouse sales sync.
 * Call from cron-job.org every 15–60 minutes as a safety net after POS pushes.
 *
 * GET/POST /api/cron/clickhouse-sync
 * Auth: Authorization: Bearer <CRON_SECRET>
 *       or x-cron-secret / ?secret=
 */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isClickHouseConfigured()) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "CLICKHOUSE_URL not set",
      ranAt: new Date().toISOString(),
    });
  }

  try {
    const result = await syncSalesToClickHouse();
    return NextResponse.json({
      success: true,
      ...result,
      ranAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("clickhouse-sync cron:", error);
    const message =
      error instanceof Error ? error.message : "Cron job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await closeClickHouse().catch(() => undefined);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
