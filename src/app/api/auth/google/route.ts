import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  isGoogleOAuthConfigured,
  signGoogleOAuthState,
} from "@/lib/auth/native/google-oauth";
import { getAppUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/sign-in?error=Google+sign-in+is+not+configured+on+this+server",
        getAppUrl(),
      ),
    );
  }

  const nextParam = request.nextUrl.searchParams.get("next")?.trim();
  const nextPath =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : undefined;

  const state = await signGoogleOAuthState(nextPath);
  const url = buildGoogleAuthorizationUrl(state);
  return NextResponse.redirect(url);
}
