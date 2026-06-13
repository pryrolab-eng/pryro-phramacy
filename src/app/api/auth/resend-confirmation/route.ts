import { NextRequest, NextResponse } from "next/server";

import {

  enforceAuthRateLimit,

  getIpFromRequestHeaders,

  rateLimitJsonResponse,

} from "@/lib/rate-limit/enforce";

import { RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/presets";

import { sendConfirmationResendEmail } from "@/lib/email/resend-confirmation";



const GENERIC_SUCCESS =

  "If an account exists for this email, we sent a new confirmation link. Check your inbox and spam folder.";



export async function POST(request: NextRequest) {

  try {

    const body = await request.json();

    const email = (body.email as string)?.trim().toLowerCase();



    if (!email || !email.includes("@")) {

      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });

    }



    const limit = await enforceAuthRateLimit({

      scope: "resendConfirmation",

      bucketKey: `${email}|${getIpFromRequestHeaders(request.headers)}`,

      message: RATE_LIMIT_MESSAGES.resendConfirmation,

    });

    if (!limit.ok) {

      return rateLimitJsonResponse(limit.message, limit.retryAfterSec);

    }



    const result = await sendConfirmationResendEmail(email, "/onboarding");

    if (!result.ok) {

      return NextResponse.json({ error: result.error }, { status: 400 });

    }



    return NextResponse.json({

      success: true,

      message: GENERIC_SUCCESS,

      provider: result.provider,

    });

  } catch (e) {

    const message = e instanceof Error ? e.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });

  }

}

