import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveAuthenticatedHomePath } from "@/lib/auth/resolve-home-redirect";
import { userMustChangePassword } from "@/lib/auth/must-change-password";

/** Resolves post-login destination for `/app` (same logic as server redirect). */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { ok: false as const, reason: "unauthenticated" },
      { status: 401 },
    );
  }

  const result = await resolveAuthenticatedHomePath(user);
  if (result.kind === "redirect") {
    return NextResponse.json({
      ok: true as const,
      path: result.path,
      mustChangePassword: userMustChangePassword({
        user_metadata: user.user_metadata ?? {},
      }),
    });
  }

  return NextResponse.json(
    { ok: false as const, reason: "unauthenticated" },
    { status: 401 },
  );
}
