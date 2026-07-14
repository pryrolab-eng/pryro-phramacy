import { NextRequest, NextResponse } from "next/server";
import { establishNativeSession } from "@/lib/auth/native/session";
import { storeFindVerifiedTwoFactorSession } from "@/lib/db/two-factor-sessions-store";
import {
  enforceAuthRateLimit,
  getIpFromRequestHeaders,
  rateLimitJsonResponse,
} from "@/lib/rate-limit/enforce";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/presets";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function POST(request: NextRequest) {
  try {
    const requestToken = request.headers.get("x-csrf-token");
    const cookieStore = await import("next/headers").then((m) => m.cookies());
    const cookieToken = cookieStore.get("csrf_token")?.value;

    if (!requestToken || !cookieToken || requestToken !== cookieToken) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const { sessionToken } = await request.json();

    if (!sessionToken || typeof sessionToken !== "string") {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }

    const ip = getIpFromRequestHeaders(request.headers);
    const limit = await enforceAuthRateLimit({
      scope: "complete2fa",
      bucketKey: `${sessionToken}|${ip}`,
      message: RATE_LIMIT_MESSAGES.complete2fa,
    });
    if (!limit.ok) {
      return rateLimitJsonResponse(limit.message, limit.retryAfterSec);
    }

    const session = await storeFindVerifiedTwoFactorSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: "Not verified" }, { status: 400 });
    }

    await establishNativeSession(session.user_id);
    await writeAuditLog({
      pharmacyId: null,
      userId: session.user_id,
      action: "LOGIN",
      tableName: "auth.sessions",
      newValues: { method: "2fa" },
      ...auditRequestMetadata(request),
    });
    return NextResponse.json({
      success: true,
      nativeSession: true,
    });
  } catch (error) {
    console.error("POST /api/auth/complete-2fa", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
