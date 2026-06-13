import type { AuthUser } from "@/lib/auth/types";

const SESSION_VALID_TTL_MS = 60_000;
const AUTH_USER_TTL_MS = 60_000;

type SessionCacheEntry = { userId: string; expiresAt: number };
type AuthUserCacheEntry = { user: AuthUser; expiresAt: number };

const globalCache = globalThis as unknown as {
  __nativeSessionValid?: Map<string, SessionCacheEntry>;
  __nativeAuthUserCache?: Map<string, AuthUserCacheEntry>;
  __nativeRevokedSessions?: Set<string>;
};

function sessionValidMap() {
  if (!globalCache.__nativeSessionValid) {
    globalCache.__nativeSessionValid = new Map();
  }
  return globalCache.__nativeSessionValid;
}

function authUserMap() {
  if (!globalCache.__nativeAuthUserCache) {
    globalCache.__nativeAuthUserCache = new Map();
  }
  return globalCache.__nativeAuthUserCache;
}

function revokedSet() {
  if (!globalCache.__nativeRevokedSessions) {
    globalCache.__nativeRevokedSessions = new Set();
  }
  return globalCache.__nativeRevokedSessions;
}

export function markNativeSessionRevoked(sessionId: string): void {
  revokedSet().add(sessionId);
  sessionValidMap().delete(sessionId);
}

export function isNativeSessionRevoked(sessionId: string): boolean {
  return revokedSet().has(sessionId);
}

export function cacheNativeSessionValid(
  sessionId: string,
  userId: string,
): void {
  sessionValidMap().set(sessionId, {
    userId,
    expiresAt: Date.now() + SESSION_VALID_TTL_MS,
  });
}

export function getCachedNativeSessionValid(
  sessionId: string,
  userId: string,
): boolean {
  if (isNativeSessionRevoked(sessionId)) return false;
  const entry = sessionValidMap().get(sessionId);
  if (!entry || entry.expiresAt <= Date.now()) {
    sessionValidMap().delete(sessionId);
    return false;
  }
  return entry.userId === userId;
}

export function cacheNativeAuthUser(user: AuthUser): void {
  authUserMap().set(user.id, {
    user,
    expiresAt: Date.now() + AUTH_USER_TTL_MS,
  });
}

export function getCachedNativeAuthUser(userId: string): AuthUser | null {
  const entry = authUserMap().get(userId);
  if (!entry || entry.expiresAt <= Date.now()) {
    authUserMap().delete(userId);
    return null;
  }
  return entry.user;
}

export function invalidateNativeAuthUserCache(userId: string): void {
  authUserMap().delete(userId);
}
