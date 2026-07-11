import { NextRequest, NextResponse } from "next/server";
import { verifyEmailChangeToken } from "@/lib/auth/native/auth-tokens";
import { adminUpdateAuthUserEmail } from "@/lib/auth/admin-users";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/db/audit-logs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL(
        "/sign-in?error=" + encodeURIComponent("Invalid verification link"),
        request.url,
      ),
    );
  }

  const payload = await verifyEmailChangeToken(token);
  if (!payload) {
    return NextResponse.redirect(
      new URL(
        "/sign-in?error=" +
          encodeURIComponent(
            "This verification link has expired or is invalid. Please request a new email change.",
          ),
        request.url,
      ),
    );
  }

  // Verify the pending state still matches (single-use: token must not be consumed)
  const user = await prisma.auth_users.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      email_change: true,
      email_change_token_new: true,
    },
  });

  if (
    !user ||
    user.email_change !== payload.newEmail ||
    user.email_change_token_new !== token
  ) {
    return NextResponse.redirect(
      new URL(
        "/sign-in?error=" +
          encodeURIComponent(
            "This verification link has already been used or is no longer valid.",
          ),
        request.url,
      ),
    );
  }

  // Update email in both auth_users and public_users
  await adminUpdateAuthUserEmail(payload.userId, payload.newEmail);

  // Clear pending state
  await prisma.auth_users.update({
    where: { id: payload.userId },
    data: {
      email_change: null,
      email_change_token_new: null,
      email_change_sent_at: null,
      email_change_confirm_status: 1,
    },
  });

  // Audit log
  await writeAuditLog({
    pharmacyId: null,
    userId: payload.userId,
    action: "UPDATE",
    tableName: "auth.users",
    recordId: payload.userId,
    newValues: { emailChanged: true, newEmail: payload.newEmail, oldEmail: user.email },
  });

  // Redirect to settings with success
  const redirectUrl = new URL("/pharmacy/settings?tab=general", request.url);
  redirectUrl.searchParams.set("success", "Email address updated successfully.");
  return NextResponse.redirect(redirectUrl);
}
