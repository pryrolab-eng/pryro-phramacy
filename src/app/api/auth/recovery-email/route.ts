import { NextRequest, NextResponse } from "next/server";
import { sendNativePasswordRecoveryEmail } from "@/lib/email/native-auth-emails";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const result = await sendNativePasswordRecoveryEmail(email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      message: "Check your email for a password reset link.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
