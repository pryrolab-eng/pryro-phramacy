import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import {
  storeListCustomers,
  storeGetCustomerStats,
  storeGetRecentCustomers,
} from "@/lib/db/customers-store";
import type { CustomerDbRow } from "@/lib/customers/format-customer";
import type { CustomerRow } from "@/lib/http/customers";
import { cacheGet, cacheSet } from "@/lib/cache/redis-cache";

const REDIS_TTL = 300;

function dbRowToCustomerRow(row: CustomerDbRow): CustomerRow {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    allergies: row.allergies?.join(", ") ?? undefined,
    insurance: row.insurance_number ?? undefined,
    insurance_number: row.insurance_number ?? undefined,
    status: row.is_active !== false ? "active" : "inactive",
  };
}

async function getCachedCustomersData(
  userId: string,
  pharmacyId: string,
  branchId: string | null,
) {
  const cacheKey = `customers:${pharmacyId}:${branchId ?? "all"}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const [customersDb, stats, recentDb] = await Promise.all([
    storeListCustomers(pharmacyId),
    storeGetCustomerStats(pharmacyId, branchId),
    storeGetRecentCustomers(pharmacyId, branchId, 10),
  ]);

  const data = {
    customers: customersDb.map(dbRowToCustomerRow),
    stats,
    recent: recentDb.map(dbRowToCustomerRow),
  };

  await cacheSet(cacheKey, data, REDIS_TTL);

  return data;
}

const getCachedCustomersDataCached = unstable_cache(
  getCachedCustomersData,
  ["pharmacy-customers"],
  { revalidate: 300, tags: ["pharmacy-customers"] },
);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const scope = parseBranchScopeFromRequest(request);

    const data = await getCachedCustomersDataCached(
      user.id,
      pharmacyId,
      scope.branchId ?? null,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/customers/combined", error);
    return NextResponse.json(
      { customers: [], stats: { total: 0, active: 0, newThisMonth: 0, withInsurance: 0 }, recent: [] },
      { status: 200 },
    );
  }
}