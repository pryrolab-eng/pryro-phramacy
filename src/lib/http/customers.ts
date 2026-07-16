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

export type CustomerSaleRow = {
  id: string;
  receiptNumber: string | null;
  totalAmount: number;
  paymentMethod: string | null;
  createdAt: string | null;
};

export type CustomerDetail = {
  customer: CustomerRow;
  recentSales: CustomerSaleRow[];
};

export type UpdateCustomerInput = {
  name?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  allergies?: string;
  insurance?: string;
  status?: "active" | "inactive";
};

export const customersKeys = {
  all: ["customers"] as const,
  list: () => [...customersKeys.all, "list"] as const,
  detail: (id: string) => [...customersKeys.all, "detail", id] as const,
  search: (q: string) => [...customersKeys.all, "search", q] as const,
  combined: () => [...customersKeys.all, "combined"] as const,
};

export type CombinedCustomersData = {
  customers: CustomerRow[];
  stats: { total: number; active: number; withInsurance: number; newThisMonth: number };
  recent: CustomerRow[];
};

export async function getCombinedCustomersData(): Promise<CombinedCustomersData> {
  return fetchJson<CombinedCustomersData>("/api/customers/combined");
}

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

export type CustomerImportFailure = {
  rowNumber: number;
  label: string;
  error: string;
};

export type CustomerImportResult = {
  success: boolean;
  attempted: number;
  succeeded: number;
  failures: CustomerImportFailure[];
  error?: string;
};

export async function importCustomers(
  rows: CreateCustomerInput[],
): Promise<CustomerImportResult> {
  return fetchJson<CustomerImportResult>("/api/customers/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  return fetchJson<CustomerDetail>(`/api/customers/${id}`);
}

export async function updateCustomer(id: string, body: UpdateCustomerInput) {
  return fetchJson<{ success: boolean; customer?: CustomerRow; error?: string }>(
    `/api/customers/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function deleteCustomer(id: string) {
  return fetchJson<{ success: boolean; error?: string }>(
    `/api/customers/${id}`,
    { method: "DELETE" },
  );
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
