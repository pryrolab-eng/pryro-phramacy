import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { resolveAuthenticatedHomePath } from "@/lib/auth/resolve-home-redirect";

/** Post-login entry — delegates to shared role routing (no UI). */
export default async function PostAuthEntryPage() {
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
