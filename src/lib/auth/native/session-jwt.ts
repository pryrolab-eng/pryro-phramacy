import { SignJWT, jwtVerify } from "jose";

export type SessionJwtPayload = {
  sub: string;
  sid: string;
};

/** Short-lived access cookie (middleware + API). */
export const ACCESS_SESSION_TTL_MS = 60 * 60 * 1000;

/** Refresh cookie + DB session row lifetime. */
export const REFRESH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set (min 32 chars) when NATIVE_AUTH_ENABLED is on",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionJwt(
  payload: SessionJwtPayload,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({ sid: payload.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()
    .sign(getAuthSecret());
}

export async function verifySessionJwt(
  token: string,
): Promise<SessionJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sub = payload.sub;
    const sid = payload.sid;
    if (!sub || typeof sub !== "string" || !sid || typeof sid !== "string") {
      return null;
    }
    return { sub, sid };
  } catch {
    return null;
  }
}

export async function signRefreshJwt(
  payload: SessionJwtPayload,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({ sid: payload.sid, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()
    .sign(getAuthSecret());
}

export async function verifyRefreshJwt(
  token: string,
): Promise<SessionJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.typ !== "refresh") return null;
    const sub = payload.sub;
    const sid = payload.sid;
    if (!sub || typeof sub !== "string" || !sid || typeof sid !== "string") {
      return null;
    }
    return { sub, sid };
  } catch {
    return null;
  }
}
