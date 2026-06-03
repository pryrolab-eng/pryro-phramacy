import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { resolveAuthenticatedHomePath } from "@/lib/auth/resolve-home-redirect";

/** Resolves post-login destination for `/app` (same logic as server redirect). */
export async function GET(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return json({ ok: false as const, reason: "unauthenticated" }, { status: 401 });
  }

  const result = await resolveAuthenticatedHomePath(supabase, user);
  if (result.kind === "redirect") {
    return json({ ok: true as const, path: result.path });
  }

  return json({ ok: false as const, reason: "unauthenticated" }, { status: 401 });
}
