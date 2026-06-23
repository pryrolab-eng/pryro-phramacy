/** Pryrox-native auth only. Set NATIVE_AUTH_ENABLED=false only for emergency rollback. */
export function isNativeAuthEnabled(): boolean {
  return process.env.NATIVE_AUTH_ENABLED !== "false";
}

export const SESSION_COOKIE_NAME = "pryrox_session";
export const REFRESH_COOKIE_NAME = "pryrox_refresh";
