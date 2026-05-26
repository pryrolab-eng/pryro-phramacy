import { fetchJson } from "./client";

export type CustomerSearchRow = {
  id: string;
  name: string;
  phone: string;
  insurance_number?: string | null;
};

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  allergies?: string;
  insurance?: string;
  totalPurchases?: number;
  lastVisit?: string;
  status?: "active" | "inactive" | string;
  insurance_number?: string | null;
};

export const customersKeys = {
  all: ["customers"] as const,
  list: () => [...customersKeys.all, "list"] as const,
  search: (q: string) => [...customersKeys.all, "search", q] as const,
};

export async function getCustomers(): Promise<CustomerRow[]> {
  try {
    const data = await fetchJson<CustomerRow[]>("/api/customers");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export type CreateCustomerInput = {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  allergies?: string;
  insurance?: string;
};

export async function createCustomer(body: CreateCustomerInput) {
  return fetchJson<{
    success: boolean;
    customer?: { id: string; name: string; phone: string };
    error?: string;
  }>("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function searchCustomers(q: string): Promise<CustomerSearchRow[]> {
  if (q.trim().length < 2) return [];
  try {
    const data = await fetchJson<CustomerSearchRow[]>(
      `/api/customers?q=${encodeURIComponent(q.trim())}`,
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
