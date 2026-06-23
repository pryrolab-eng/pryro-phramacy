export function isEmailNotConfirmedError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    code === "email_not_confirmed" ||
    msg.includes("email not confirmed") ||
    msg.includes("email address not confirmed")
  );
}

export function isEmailNotConfirmedMessage(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("email not confirmed") ||
    lower.includes("email address not confirmed")
  );
}

export type AuthErrorLike = { message?: string; code?: string };
