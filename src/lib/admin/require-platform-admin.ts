import { createClient } from "../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

export async function requirePlatformAdminApi() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
  if (!allowed) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, supabase, user };
}
