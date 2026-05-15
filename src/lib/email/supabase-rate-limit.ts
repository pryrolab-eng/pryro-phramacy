/** Detect Supabase Auth built-in email rate limit / quota errors. */
export function isSupabaseEmailRateLimited(
  error: { message?: string; status?: number; code?: string } | null | undefined
): boolean {
  if (!error) return false;

  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  return (
    error.status === 429 ||
    code === "over_email_send_rate_limit" ||
    code === "too_many_requests" ||
    msg.includes("rate limit") ||
    msg.includes("email rate limit") ||
    msg.includes("over_email_send_rate_limit") ||
    msg.includes("too many requests") ||
    msg.includes("email sending quota") ||
    msg.includes("email rate limit exceeded")
  );
}
