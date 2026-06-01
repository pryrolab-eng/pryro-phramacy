import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import {
  consumeResendConfirmationSlot,
  resendConfirmationRateLimitKey,
  RESEND_CONFIRMATION_RATE_LIMIT_MESSAGE,
} from "@/lib/auth/resend-confirmation-rate-limit";
import { sendConfirmationResendEmail } from "@/lib/email/resend-confirmation";

const GENERIC_SUCCESS =
  "If an account exists for this email, we sent a new confirmation link. Check your inbox and spam folder.";

export async function POST(request: NextRequest) {
  const { json } = createRouteHandlerClient(request);

  try {
    const body = await request.json();
    const email = (body.email as string)?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return json({ error: "A valid email address is required." }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip");

    const limitKey = resendConfirmationRateLimitKey(email, ip);
    if (!consumeResendConfirmationSlot(limitKey)) {
      return json(
        { error: RESEND_CONFIRMATION_RATE_LIMIT_MESSAGE },
        { status: 429 },
      );
    }

    const result = await sendConfirmationResendEmail(email, "/onboarding");

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      success: true,
      message: GENERIC_SUCCESS,
      provider: result.provider,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return json({ error: message }, { status: 500 });
  }
}
