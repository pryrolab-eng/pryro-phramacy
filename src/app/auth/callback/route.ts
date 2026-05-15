import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "../../../../supabase/route-handler";

function redirectWithError(
  requestUrl: URL,
  path: string,
  message: string,
  withCookies: (r: NextResponse) => NextResponse
) {
  const url = new URL(path, requestUrl.origin);
  url.searchParams.set("error", message);
  return withCookies(NextResponse.redirect(url));
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const redirect_to =
    requestUrl.searchParams.get("next") ||
    requestUrl.searchParams.get("redirect_to");

  const { supabase, withCookies } = createRouteHandlerClient(request);

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (error) {
      const isRecovery = type === "recovery" || redirect_to?.includes("reset-password");
      return redirectWithError(
        requestUrl,
        isRecovery ? "/forgot-password" : "/sign-in",
        error.message,
        withCookies
      );
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const isRecovery = redirect_to?.includes("reset-password");
      const message = isRecovery
        ? "This reset link is invalid or was opened in a different browser. Request a new link and open it in the same browser where you requested it."
        : error.message;
      return redirectWithError(
        requestUrl,
        isRecovery ? "/forgot-password" : "/sign-in",
        message,
        withCookies
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo =
    redirect_to || (user ? "/onboarding" : "/sign-in");

  return withCookies(
    NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
  );
}
