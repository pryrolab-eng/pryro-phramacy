import { SignJWT, jwtVerify } from "jose";

const CSRF_SECRET = process.env.CSRF_SECRET ?? process.env.AUTH_SECRET;
const CSRF_TOKEN_TTL = 60 * 60 * 1000;

function getCsrfSecret(): Uint8Array {
  if (!CSRF_SECRET || CSRF_SECRET.length < 32) {
    throw new Error("CSRF_SECRET or AUTH_SECRET must be set (min 32 chars)");
  }
  return new TextEncoder().encode(CSRF_SECRET);
}

export async function generateCsrfToken(): Promise<string> {
  return new SignJWT({ csrf: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor((Date.now() + CSRF_TOKEN_TTL) / 1000))
    .setIssuedAt()
    .sign(getCsrfSecret());
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getCsrfSecret());
    return payload.csrf === true;
  } catch {
    return false;
  }
}

export function validateCsrfToken(
  headerToken: string | null,
  cookieToken: string | undefined
): boolean {
  if (!headerToken || !cookieToken) return false;
  return headerToken === cookieToken;
}

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";