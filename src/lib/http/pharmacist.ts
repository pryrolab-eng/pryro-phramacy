import { fetchJson } from "./client";

export type CreatePharmacistInput = {
  email: string;
  password?: string;
  full_name: string;
  phone: string;
  role?: string;
  pharmacy_id: string;
  pharmacy_name?: string;
};

export type StaffInviteCredentials = {
  email: string;
  temporaryPassword: string;
  signInUrl: string;
};

export type StaffInviteDeliveryResult = {
  emailSent?: boolean;
  emailError?: string;
  credentials?: StaffInviteCredentials;
};

type CreatePharmacistResponse = {
  success?: boolean;
  message?: string;
  userId?: string;
  emailSent?: boolean;
  emailError?: string;
  credentials?: StaffInviteCredentials;
  error?: string;
};

/** `POST /api/pharmacist` */
export async function createPharmacist(
  input: CreatePharmacistInput,
): Promise<CreatePharmacistResponse> {
  const data = await fetchJson<CreatePharmacistResponse>("/api/pharmacist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (data.success !== true) {
    throw new Error(data.error ?? "Failed to create pharmacist");
  }
  return data;
}
