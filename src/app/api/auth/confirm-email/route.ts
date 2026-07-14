import { NextRequest, NextResponse } from "next/server";
import { verifyEmailConfirmToken } from "@/lib/auth/native/auth-tokens";
import { confirmAuthUserEmailFromDb } from "@/lib/db/auth-credentials";
import { sanitizeRedirectPath } from "@/lib/auth/trusted-origins";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const next = sanitizeRedirectPath(
    request.nextUrl.searchParams.get("next") ?? "/onboarding",
    "/onboarding"
  );

  if (!token) {
    return NextResponse.redirect(
      new URL("/sign-in?error=" + encodeURIComponent("Invalid confirmation link"), request.url),
    );
  }

  const payload = await verifyEmailConfirmToken(token);
  if (!payload) {
    return NextResponse.redirect(
      new URL(
        "/auth/confirm?error=" +
          encodeURIComponent("This confirmation link has expired. Request a new link."),
        request.url,
      ),
    );
  }

  await confirmAuthUserEmailFromDb(payload.userId);

  const destination = new URL(next, request.url);
  destination.searchParams.set(
    "success",
    "Email confirmed. You can sign in to continue.",
  );
  return NextResponse.redirect(destination);
}
