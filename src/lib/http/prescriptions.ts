import { fetchJson } from "./client";

export const prescriptionsKeys = {
  all: ["prescriptions"] as const,
  list: () => [...prescriptionsKeys.all, "list"] as const,
};

export type PrescriptionRow = {
  id: string;
  patient: string;
  doctor: string;
  medications: string[];
  priority: "high" | "medium" | "low" | string;
  status: "pending" | "completed" | "dispensed" | string;
  time: string;
  insurance: string;
  created_at: string;
};

export type CreatePrescriptionInput = {
  patient: string;
  doctor: string;
  medications: string[];
  priority: string;
  insurance: string;
  notes?: string;
};

export async function getPrescriptions(): Promise<PrescriptionRow[]> {
  try {
    const data = await fetchJson<PrescriptionRow[]>("/api/prescriptions");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createPrescription(body: CreatePrescriptionInput) {
  return fetchJson("/api/prescriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updatePrescription(
  id: string,
  body: Partial<CreatePrescriptionInput> & { status?: string },
) {
  return fetchJson(`/api/prescriptions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
