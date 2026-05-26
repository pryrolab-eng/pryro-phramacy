import { fetchJson } from "./client";
import type { PharmacyEntitlementsSnapshot } from "@/lib/subscription/lifecycle/types";

export const entitlementsKeys = {
  all: ["entitlements"] as const,
  pharmacy: () => [...entitlementsKeys.all, "pharmacy"] as const,
};

export async function getPharmacyEntitlementsSnapshot(): Promise<PharmacyEntitlementsSnapshot> {
  return fetchJson<PharmacyEntitlementsSnapshot>("/api/entitlements", {
    credentials: "include",
    cache: "no-store",
  });
}
