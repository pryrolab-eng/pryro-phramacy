import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { signEmailChangeToken } from "@/lib/auth/native/auth-tokens";
import { prisma } from "@/lib/db/prisma";
import { enforceAuthRateLimit } from "@/lib/rate-limit/enforce";
import {
  sendEmailChangeVerification,
  sendEmailChangeNotification,
} from "@/lib/email/native-auth-emails";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

const bodySchema = z.object({
  newEmail: z.string().email("Invalid email format"),
});

export async function POST(request: NextRequest) {
  try {
    const requestToken = request.headers.get("x-csrf-token");
    const cookieStore = await import("next/headers").then((m) => m.cookies());
    const cookieToken = cookieStore.get("csrf_token")?.value;

    if (!requestToken || !cookieToken || requestToken !== cookieToken) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const user = await getAuthUser();
    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors.newEmail?.[0] ?? "Invalid email" },
        { status: 400 },
      );
    }

    const newEmail = parsed.data.newEmail.trim().toLowerCase();

    // Rate limit: 3 per hour per user
    const rateLimit = await enforceAuthRateLimit({
      scope: "changeEmail",
      bucketKey: user.id,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: rateLimit.message },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } },
      );
    }

    // Generic response — don't reveal whether the email is taken
    const genericResponse = NextResponse.json({
      success: true,
      message: "If this email is available, a verification link has been sent.",
    });

    // Check if email is already in use
    const existing = await prisma.auth_users.findFirst({
      where: { email: newEmail },
      select: { id: true },
    });
    if (existing && existing.id !== user.id) {
      // Still return the same response to prevent enumeration
      return genericResponse;
    }

    // Sign token with 1-hour TTL
    const token = await signEmailChangeToken(user.id, newEmail);

    // Store pending state
    await prisma.auth_users.update({
      where: { id: user.id },
      data: {
        email_change: newEmail,
        email_change_token_new: token,
        email_change_sent_at: new Date(),
        email_change_confirm_status: 0,
      },
    });

    // Send verification to new email + notification to old email
    await sendEmailChangeVerification(newEmail, token);
    await sendEmailChangeNotification(user.email, newEmail);

    // Audit log
    await writeAuditLog({
      pharmacyId: null,
      userId: user.id,
      action: "UPDATE",
      tableName: "auth.users",
      recordId: user.id,
      newValues: { emailChangeInitiated: true, newEmail },
      ...auditRequestMetadata(request),
    });

    return genericResponse;
  } catch (error) {
    console.error("POST /api/auth/change-email", error);
    return NextResponse.json(
      { error: "Failed to process email change" },
      { status: 500 },
    );
  }
}
