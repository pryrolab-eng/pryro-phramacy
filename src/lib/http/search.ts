import { fetchJson } from "@/lib/http/client";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";
import type {
  AdminGlobalSearchResult,
  PharmacyGlobalSearchResult,
} from "@/lib/search/types";

const EMPTY_PHARMACY: PharmacyGlobalSearchResult = {
  customers: [],
  products: [],
  prescriptions: [],
  sales: [],
  staff: [],
  branches: [],
};

const EMPTY_ADMIN: AdminGlobalSearchResult = {
  pharmacies: [],
  staff: [],
  branches: [],
};

export async function searchPharmacyData(
  q: string,
): Promise<PharmacyGlobalSearchResult> {
  const trimmed = q.trim();
  if (trimmed.length < MIN_GLOBAL_SEARCH_LENGTH) return EMPTY_PHARMACY;
  try {
    const data = await fetchJson<PharmacyGlobalSearchResult>(
      `/api/search?q=${encodeURIComponent(trimmed)}`,
    );
    return {
      customers: data.customers ?? [],
      products: data.products ?? [],
      prescriptions: data.prescriptions ?? [],
      sales: data.sales ?? [],
      staff: data.staff ?? [],
      branches: data.branches ?? [],
    };
  } catch {
    return EMPTY_PHARMACY;
  }
}

export async function searchAdminData(
  q: string,
): Promise<AdminGlobalSearchResult> {
  const trimmed = q.trim();
  if (trimmed.length < MIN_GLOBAL_SEARCH_LENGTH) return EMPTY_ADMIN;
  try {
    const data = await fetchJson<AdminGlobalSearchResult>(
      `/api/admin/search?q=${encodeURIComponent(trimmed)}`,
    );
    return {
      pharmacies: data.pharmacies ?? [],
      staff: data.staff ?? [],
      branches: data.branches ?? [],
    };
  } catch {
    return EMPTY_ADMIN;
  }
}
