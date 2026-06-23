import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth/auth-mode";
import { refreshNativeAccessFromRefreshToken } from "@/lib/auth/native/session";

export async function POST(request: NextRequest) {
  const refreshJwt =
    request.cookies.get(REFRESH_COOKIE_NAME)?.value ?? null;
  const ok = await refreshNativeAccessFromRefreshToken(refreshJwt);
  if (!ok) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
