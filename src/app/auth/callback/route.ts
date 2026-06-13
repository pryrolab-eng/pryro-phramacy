import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";

/** Legacy Supabase OAuth/email callback — redirect to sign-in. */
export async function GET(_request: NextRequest) {
  const url = new URL("/sign-in", getAppUrl());
  url.searchParams.set(
    "error",
    "This sign-in link is no longer valid. Sign in with email or Google.",
  );
  return NextResponse.redirect(url);
}
