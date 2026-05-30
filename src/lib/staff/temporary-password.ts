/** Auto-generated temporary password for staff invites and resends. */
export function generateTemporaryPassword(): string {
  return (
    Math.random().toString(36).slice(2, 6) +
    Math.random().toString(36).slice(2, 6).toUpperCase() +
    "!1"
  );
}
