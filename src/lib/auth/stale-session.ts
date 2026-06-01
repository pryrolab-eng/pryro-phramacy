/** Supabase returned a refresh token that no longer exists server-side. */
export function isStaleRefreshTokenError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    code === "refresh_token_not_found" ||
    msg.includes("refresh_token_not_found") ||
    msg.includes("invalid refresh token")
  );
}
