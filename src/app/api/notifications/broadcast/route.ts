import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "deprecated",
      message:
        "In-memory broadcast was removed. Use emitNotificationEvent() and the notification outbox worker.",
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: "deprecated",
      message: "Use GET /api/notifications or the SSE stream instead.",
    },
    { status: 410 },
  );
}
