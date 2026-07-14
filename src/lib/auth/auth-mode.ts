/** Pryrox-native auth only. Set NATIVE_AUTH_ENABLED=false only for emergency rollback. */
export function isNativeAuthEnabled(): boolean {
  return process.env.NATIVE_AUTH_ENABLED !== "false";
}

const isProd = process.env.NODE_ENV === "production";
const SECURE_PREFIX = isProd ? "__Secure-" : "";

export const SESSION_COOKIE_NAME = `${SECURE_PREFIX}pryrox_session`;
export const REFRESH_COOKIE_NAME = `${SECURE_PREFIX}pryrox_refresh`;
