import { fetchJson } from "./client";

export type CreatePharmacistInput = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role?: string;
  pharmacy_id: string;
};

type CreatePharmacistResponse = {
  success?: boolean;
  message?: string;
  userId?: string;
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
