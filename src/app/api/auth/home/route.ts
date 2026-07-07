import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveAuthenticatedHomePath } from "@/lib/auth/resolve-home-redirect";
import { readMustChangePasswordFromDb } from "@/lib/auth/must-change-password";

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
    const mustChangePassword = await readMustChangePasswordFromDb(user.id);
    return NextResponse.json({
      ok: true as const,
      path: result.path,
      mustChangePassword,
    });
  }

  return NextResponse.json(
    { ok: false as const, reason: "unauthenticated" },
    { status: 401 },
  );
}
