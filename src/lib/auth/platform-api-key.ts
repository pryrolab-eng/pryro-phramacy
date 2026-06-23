import type { NextRequest } from "next/server";
import { hashApiKeySecret, isHashedApiKeySecret } from "@/lib/auth/api-key-hash";
import { prisma } from "@/lib/db/prisma";

/** Header for third-party integrations calling Pryrox APIs. */
export const PLATFORM_API_KEY_HEADER = "x-pryrox-api-key";

export type PlatformApiKeyContext = {
  id: string;
  name: string;
  permissions: string[];
};

export function extractPlatformApiKeyToken(request: NextRequest): string | null {
  const header = request.headers.get(PLATFORM_API_KEY_HEADER)?.trim();
  if (header) return header;

  const auth = request.headers.get("authorization")?.trim();
  if (!auth) return null;

  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/**
 * Resolves a **platform** integration key (`api_keys.pharmacy_id IS NULL`).
 * These keys are issued by Pryrox admins for external developers / partners —
 * not per-pharmacy tenant credentials.
 */
export async function resolvePlatformApiKey(
  token: string,
): Promise<PlatformApiKeyContext | null> {
  if (!token || token.length < 8) return null;
  const tokenHash = await hashApiKeySecret(token);

  const row = await prisma.api_keys.findFirst({
    where: {
      pharmacy_id: null,
      is_active: true,
      OR: [{ key_hash: tokenHash }, { key_hash: token }],
      AND: [{ OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }] }],
    },
    select: {
      id: true,
      name: true,
      key_hash: true,
      permissions: true,
    },
  });

  if (!row) return null;

  const updateData: { last_used_at: Date; key_hash?: string } = {
    last_used_at: new Date(),
  };
  if (!isHashedApiKeySecret(row.key_hash)) {
    updateData.key_hash = tokenHash;
  }

  await prisma.api_keys
    .update({ where: { id: row.id }, data: updateData })
    .catch(() => undefined);

  return {
    id: row.id,
    name: row.name,
    permissions: row.permissions ?? [],
  };
}

export async function resolvePlatformApiKeyFromRequest(
  request: NextRequest,
): Promise<PlatformApiKeyContext | null> {
  const token = extractPlatformApiKeyToken(request);
  if (!token) return null;
  return resolvePlatformApiKey(token);
}

export function platformApiKeyHasPermission(
  ctx: PlatformApiKeyContext,
  permission: string,
): boolean {
  if (ctx.permissions.length === 0) return true;
  return ctx.permissions.includes(permission) || ctx.permissions.includes("*");
}
