import { NextRequest, NextResponse } from "next/server";
import { dispatchPendingNotifications } from "@/lib/notifications/dispatch";

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

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchPendingNotifications();
    return NextResponse.json({
      success: true,
      ...result,
      ranAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("notification-dispatch cron:", error);
    const message =
      error instanceof Error ? error.message : "Cron job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
