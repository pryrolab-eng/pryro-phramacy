import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import { storeListInventory, storeStockAlerts, storeListExpiryAlerts } from "@/lib/db/inventory-store";
import { cacheGet, cacheSet } from "@/lib/cache/redis-cache";

const REDIS_TTL = 300;

async function getCachedInventoryData(
  userId: string,
  pharmacyId: string,
  branchId: string | null,
) {
  const cacheKey = `inventory:${pharmacyId}:${branchId ?? "all"}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const [inventory, stockAlerts, expiryAlerts] = await Promise.all([
    storeListInventory(pharmacyId, branchId),
    storeStockAlerts(pharmacyId, branchId),
    storeListExpiryAlerts(pharmacyId, 60),
  ]);

  const data = { inventory, stockAlerts, expiryAlerts };
  await cacheSet(cacheKey, data, REDIS_TTL);

  return data;
}

const getCachedInventoryDataCached = unstable_cache(
  getCachedInventoryData,
  ["pharmacy-inventory"],
  { revalidate: 300, tags: ["pharmacy-inventory"] },
);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);

    const data = await getCachedInventoryDataCached(user.id, pharmacyId, scope.branchId ?? null);

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/inventory/combined", error);
    return NextResponse.json(
      { inventory: [], stockAlerts: { all: [], lowStock: [], expiring: [] }, expiryAlerts: [] },
      { status: 200 },
    );
  }
}