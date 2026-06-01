export function isInvalidLoginCredentials(
  error: { message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  return (error.message ?? "")
    .toLowerCase()
    .includes("invalid login credentials");
}

export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
