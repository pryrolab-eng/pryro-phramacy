import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { POST_AUTH_ENTRY_PATH } from "@/lib/auth/resolve-home-redirect";
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

  let authFailed = false;
  let authErrorMessage =
    "Could not sign you in. Your link may have expired — try signing in again.";

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (error) {
      authFailed = true;
      authErrorMessage = error.message;
      const isRecovery = type === "recovery" || redirect_to?.includes("reset-password");
      if (isRecovery) {
        return redirectWithError(
          requestUrl,
          "/forgot-password",
          error.message,
          withCookies,
        );
      }
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      authFailed = true;
      authErrorMessage = error.message;
      const isRecovery = redirect_to?.includes("reset-password");
      if (isRecovery) {
        return redirectWithError(
          requestUrl,
          "/forgot-password",
          "This reset link is invalid or was opened in a different browser. Request a new link and open it in the same browser where you requested it.",
          withCookies,
        );
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (authFailed || !user) {
    return redirectWithError(
      requestUrl,
      "/sign-in",
      authErrorMessage,
      withCookies,
    );
  }

  const redirectTo = redirect_to || POST_AUTH_ENTRY_PATH;

  return withCookies(
    NextResponse.redirect(new URL(redirectTo, requestUrl.origin)),
  );
}
