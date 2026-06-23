import { getAuthUser } from "@/lib/auth/get-auth-user";

import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";



export async function requirePlatformAdminApi() {

  const user = await getAuthUser();



  if (!user) {

    return { ok: false as const, status: 401, error: "Unauthorized" };

  }



  const allowed = await resolveIsAppPlatformAdmin(user.id);

  if (!allowed) {

    return { ok: false as const, status: 403, error: "Forbidden" };

  }



  return { ok: true as const, user };

}

