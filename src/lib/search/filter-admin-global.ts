import type { AdminPharmacyRow } from "@/lib/http/admin/pharmacies";
import { MIN_GLOBAL_SEARCH_LENGTH } from "@/lib/search/escape-ilike";
import { fieldsMatchQuery } from "@/lib/search/match-text";
import type {
  AdminGlobalSearchResult,
  AdminGlobalSearchPharmacyHit,
} from "@/lib/search/types";

const HIT_LIMIT = 20;

export function filterAdminPharmaciesFromCache(
  pharmacies: AdminPharmacyRow[],
  query: string,
): AdminGlobalSearchPharmacyHit[] {
  const q = query.trim();
  if (q.length < MIN_GLOBAL_SEARCH_LENGTH) return [];

  return pharmacies
    .filter((p) =>
      fieldsMatchQuery(
        [p.name, p.email, typeof p.phone === "string" ? p.phone : null],
        q,
      ),
    )
    .slice(0, HIT_LIMIT)
    .map((p) => ({
      id: p.id,
      name: String(p.name ?? "Pharmacy"),
      email: typeof p.email === "string" ? p.email : null,
      phone: typeof p.phone === "string" ? p.phone : null,
    }));
}

/** Merge cached pharmacy hits with server staff/branch hits. */
export function mergeAdminGlobalSearch(
  cachedPharmacies: AdminGlobalSearchPharmacyHit[],
  server: AdminGlobalSearchResult | undefined,
  hasPharmacyCache: boolean,
): AdminGlobalSearchResult {
  return {
    pharmacies: hasPharmacyCache
      ? cachedPharmacies
      : (server?.pharmacies ?? []),
    staff: server?.staff ?? [],
    branches: server?.branches ?? [],
  };
}
