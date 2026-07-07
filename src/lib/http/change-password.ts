import { fetchJson } from "./client";

export type ChangePasswordInput = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

export async function changePassword(
  input: ChangePasswordInput,
): Promise<{ success: boolean; mustChangePassword: boolean }> {
  return fetchJson("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(input),
  });
}
