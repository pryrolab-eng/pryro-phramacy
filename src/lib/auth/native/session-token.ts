import { createHash, randomBytes } from "crypto";

export type { SessionJwtPayload } from "@/lib/auth/native/session-jwt";
export {
  ACCESS_SESSION_TTL_MS,
  REFRESH_SESSION_TTL_MS,
  signRefreshJwt,
  signSessionJwt,
  verifyRefreshJwt,
  verifySessionJwt,
} from "@/lib/auth/native/session-jwt";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
