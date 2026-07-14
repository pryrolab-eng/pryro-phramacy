import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { prisma } from "@/lib/db/prisma";
import {
  enforceAuthRateLimit,
  getIpFromRequestHeaders,
  rateLimitJsonResponse,
} from "@/lib/rate-limit/enforce";
import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/presets";

export async function POST(request: NextRequest) {
  const requestToken = request.headers.get("x-csrf-token");
  const cookieStore = await import("next/headers").then((m) => m.cookies());
  const cookieToken = cookieStore.get("csrf_token")?.value;

  if (!requestToken || !cookieToken || requestToken !== cookieToken) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const { sessionToken, token } = await request.json();

    if (!sessionToken || !token) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const limit = await enforceAuthRateLimit({
      scope: "verify2fa",
      bucketKey: `${sessionToken}|${getIpFromRequestHeaders(request.headers)}`,
      message: RATE_LIMIT_MESSAGES.verify2fa,
    });
    if (!limit.ok) {
      return rateLimitJsonResponse(limit.message, limit.retryAfterSec);
    }

    const session = await prisma.two_factor_sessions.findUnique({
      where: { session_token: sessionToken },
      select: { user_id: true, expires_at: true, verified: true },
    });

    if (!session || session.verified) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
    }

    if (session.expires_at < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 400 });
    }

    const userData = await prisma.public_users.findUnique({
      where: { id: session.user_id },
      select: { two_factor_secret: true, two_factor_backup_codes: true },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    let isValid = false;

    if (userData.two_factor_backup_codes?.includes(token)) {
      isValid = true;
      const updatedCodes = userData.two_factor_backup_codes.filter(
        (code) => code !== token,
      );
      await prisma.public_users.update({
        where: { id: session.user_id },
        data: { two_factor_backup_codes: updatedCodes },
      });
    } else if (userData.two_factor_secret) {
      isValid = authenticator.verify({
        token,
        secret: userData.two_factor_secret,
      });
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    await prisma.two_factor_sessions.update({
      where: { session_token: sessionToken },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      userId: session.user_id,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}