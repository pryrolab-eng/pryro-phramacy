import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { sendPasswordRecoveryEmail } from "@/lib/email/auth-emails";

export async function POST(request: NextRequest) {
  const { json } = createRouteHandlerClient(request);

  try {
    const body = await request.json();
    const email = (body.email as string)?.trim();

    if (!email) {
      return json({ error: "Email is required." }, { status: 400 });
    }

    const redirectTo =
      (body.next as string)?.trim() ||
      (body.redirect_to as string)?.trim() ||
      "/dashboard/reset-password";

    const result = await sendPasswordRecoveryEmail(email, redirectTo);

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      success: true,
      provider: result.provider,
      message: "Check your email for a password reset link.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return json({ error: message }, { status: 500 });
  }
}
