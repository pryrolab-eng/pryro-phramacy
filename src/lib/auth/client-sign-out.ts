/** Clear native session cookie and redirect to sign-in. */
export async function signOutClient(): Promise<void> {
  window.location.href = "/api/auth/signout";
}
