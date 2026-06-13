import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearNativeSessionCookie } from "@/lib/auth/native/session";

async function clearLegacySupabaseAuthCookies() {
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name.startsWith("sb-") && name.includes("auth-token")) {
      try {
        store.set(name, "", { path: "/", maxAge: 0 });
      } catch {
        /* ignore read-only cookie store */
      }
    }
  }
}

export async function GET() {
  await clearNativeSessionCookie();
  await clearLegacySupabaseAuthCookies();
  redirect("/sign-in");
}
