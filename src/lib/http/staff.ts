import { fetchJson } from "./client";
import type {
  StaffInviteCredentials,
  StaffInviteDeliveryResult,
} from "./pharmacist";

export type { StaffInviteCredentials } from "./pharmacist";

/** Row shape returned by `GET /api/staff` (pharmacy team). */
export type StaffUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joinDate: string;
};

export const staffUsersQueryKey = ["users", "staff"] as const;

export async function getStaffUsers(): Promise<StaffUser[]> {
  const data = await fetchJson<unknown>("/api/staff");

  if (!Array.isArray(data)) {
    throw new Error("Invalid users response");
  }

  return data as StaffUser[];
}

export type StaffUpdatePayload = {
  name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
  status?: "active" | "inactive";
};

type StaffMutationResult = { success: boolean; error?: string };

function assertStaffMutationOk(result: StaffMutationResult, fallback: string) {
  if (!result.success) {
    throw new Error(result.error ?? fallback);
  }
}

/** `PUT /api/staff/:id` — `id` is the pharmacy staff row id from the list. */
export async function updateStaffMember(
  id: string,
  body: StaffUpdatePayload,
): Promise<void> {
  const result = await fetchJson<StaffMutationResult>(`/api/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertStaffMutationOk(result, "Failed to update staff member");
}

/** `DELETE /api/staff/:id` */
export async function deleteStaffMember(id: string): Promise<void> {
  const result = await fetchJson<StaffMutationResult>(`/api/staff/${id}`, {
    method: "DELETE",
  });
  assertStaffMutationOk(result, "Failed to delete staff member");
}

type ResendStaffInviteResponse = StaffInviteDeliveryResult & {
  success?: boolean;
  message?: string;
  error?: string;
};

/** `POST /api/staff/:id/resend-invite` — reset password and resend login email. */
export async function resendStaffInvite(
  id: string,
): Promise<StaffInviteDeliveryResult> {
  const data = await fetchJson<ResendStaffInviteResponse>(
    `/api/staff/${id}/resend-invite`,
    { method: "POST" },
  );
  if (data.success !== true) {
    throw new Error(data.error ?? "Failed to resend login instructions");
  }
  return {
    emailSent: data.emailSent,
    emailError: data.emailError,
    credentials: data.credentials,
  };
}
