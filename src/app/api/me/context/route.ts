import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { buildMeContextResponse } from "@/lib/auth/session-bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await buildMeContextResponse(user);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/me/context", error);
    return NextResponse.json(
      { error: "Failed to load session context" },
      { status: 500 },
    );
  }
}
