import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/auth-mode";
import { establishNativeSession } from "@/lib/auth/native/session";
import { POST_AUTH_ENTRY_PATH } from "@/lib/auth/resolve-home-redirect";
import { getAllowUserTwoFactor } from "@/lib/platform-security-policy";
import { storeCreateTwoFactorSession } from "@/lib/db/two-factor-sessions-store";
import { storeGetTwoFactorEnabled } from "@/lib/db/public-users-store";

/** After OAuth identity is resolved, honor 2FA then issue native session cookies. */
export async function completeNativeOAuthSignIn(
  userId: string,
  nextPath?: string,
): Promise<never> {
  const platformAllows2FA = await getAllowUserTwoFactor();
  const twoFactorEnabled = await storeGetTwoFactorEnabled(userId);

  if (platformAllows2FA && twoFactorEnabled) {
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await storeCreateTwoFactorSession({
      userId,
      sessionToken,
      expiresAt,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    redirect(`/verify-2fa?session=${sessionToken}`);
  }

  await establishNativeSession(userId);
  redirect(nextPath || POST_AUTH_ENTRY_PATH);
}
