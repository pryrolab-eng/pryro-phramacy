import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  platformApiKeyHasPermission,
  resolvePlatformApiKeyFromRequest,
  type PlatformApiKeyContext,
} from "@/lib/auth/platform-api-key";

export type PlatformApiKeyAuthResult =
  | { ok: true; key: PlatformApiKeyContext }
  | { ok: false; response: NextResponse };

export async function requirePlatformApiKey(
  request: NextRequest,
  permission?: string,
): Promise<PlatformApiKeyAuthResult> {
  const key = await resolvePlatformApiKeyFromRequest(request);
  if (!key) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "unauthorized",
          message:
            "A valid platform API key is required. Use Authorization: Bearer <key> or X-Pryrox-Api-Key.",
        },
        { status: 401 },
      ),
    };
  }

  if (permission && !platformApiKeyHasPermission(key, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "forbidden",
          message: `This API key does not have the "${permission}" permission.`,
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, key };
}
