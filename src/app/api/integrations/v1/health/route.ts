import { NextResponse } from "next/server";
import { requirePlatformApiKey } from "@/lib/auth/require-platform-api-key";

/**
 * Public integration surface for external developers.
 * Authenticate with a platform API key from Admin → Settings → Integrations.
 */
export async function GET(request: Request) {
  const auth = await requirePlatformApiKey(request as import("next/server").NextRequest);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    ok: true,
    service: "pryrox-integrations",
    version: "v1",
    keyName: auth.key.name,
  });
}
