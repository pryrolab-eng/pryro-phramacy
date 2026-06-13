import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveAuthenticatedHomePath } from "@/lib/auth/resolve-home-redirect";

/**
 * Legacy OAuth / email-confirm landing URL (`/auth-success`).
 * Delegates to the same post-login resolver as `/app`.
 */
export default async function AuthSuccessPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  const result = await resolveAuthenticatedHomePath(user);
  if (result.kind === "redirect") {
    redirect(result.path);
  }

  redirect("/sign-in");
}
