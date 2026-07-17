import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { buildSessionBootstrap } from "@/lib/auth/session-bootstrap";

export const dynamic = "force-dynamic";

/** Post-login warm cache: home path + destination data in one round-trip. */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { ok: false as const, reason: "unauthenticated" },
      { status: 401 },
    );
  }

  try {
    const payload = await buildSessionBootstrap(user);
    if (!payload.ok) {
      return NextResponse.json(payload, { status: 401 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/auth/bootstrap", error);
    return NextResponse.json(
      { ok: false as const, reason: "bootstrap_failed" },
      { status: 500 },
    );
  }
}
