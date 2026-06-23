import { NextRequest, NextResponse } from "next/server";
import { completeNativeOAuthSignIn } from "@/lib/auth/native/complete-oauth-sign-in";
import {
  exchangeGoogleAuthCode,
  fetchGoogleUserProfile,
  isGoogleOAuthConfigured,
  verifyGoogleOAuthState,
} from "@/lib/auth/native/google-oauth";
import { findOrCreateGoogleAuthUser } from "@/lib/db/oauth-google";
import { getAppUrl } from "@/lib/app-url";

function redirectSignInError(message: string) {
  const url = new URL("/sign-in", getAppUrl());
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return redirectSignInError("Google sign-in is not available");
  }

  const { searchParams } = request.nextUrl;
  const error = searchParams.get("error");
  if (error) {
    return redirectSignInError("Google sign-in was cancelled or denied");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return redirectSignInError("Invalid Google sign-in response");
  }

  const statePayload = await verifyGoogleOAuthState(state);
  if (!statePayload) {
    return redirectSignInError("Sign-in session expired — try again");
  }

  let userId: string;
  try {
    const { accessToken } = await exchangeGoogleAuthCode(code);
    const profile = await fetchGoogleUserProfile(accessToken);

    if (!profile.emailVerified) {
      return redirectSignInError(
        "Your Google email must be verified before signing in",
      );
    }

    userId = await findOrCreateGoogleAuthUser(profile);
  } catch (err) {
    console.error("GET /api/auth/google/callback", err);
    return redirectSignInError("Could not complete Google sign-in");
  }

  await completeNativeOAuthSignIn(userId, statePayload.nextPath);
}
