import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "../../../../../supabase/service";
import {
  expireStalePendingPayments,
  getPendingPaymentMaxAgeDays,
} from "@/lib/admin/cancel-pending-billing";

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

/** Daily: cancel pending payments/subscriptions older than PENDING_PAYMENT_EXPIRE_DAYS (default 7). */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createServiceClient();
    const maxAgeDays = getPendingPaymentMaxAgeDays();
    const result = await expireStalePendingPayments(admin, maxAgeDays);

    return NextResponse.json({
      success: true,
      maxAgeDays,
      ...result,
      ranAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("cancel-stale-pending-payments cron:", error);
    const message = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
