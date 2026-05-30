import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { resolveAuthenticatedHomePath } from "@/lib/auth/resolve-home-redirect";

/**
 * Legacy OAuth / email-confirm landing URL (`/auth-success`).
 * Prefer `/auth/callback` for new Supabase redirect config; this route delegates
 * to the same post-login resolver as `/app`.
 */
export default async function AuthSuccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/sign-in");
  }

  const result = await resolveAuthenticatedHomePath(supabase, user);
  if (result.kind === "redirect") {
    redirect(result.path);
  }

  redirect("/sign-in");
}
