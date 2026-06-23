import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  fetchRecentSalesForCustomer,
} from "@/lib/customers/customer-sales";
import { storeFindCustomer } from "@/lib/db/customers-store";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

function readLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId")?.trim() || "";
    const phone = searchParams.get("phone")?.trim() || "";
    const name = searchParams.get("name")?.trim() || "";
    const limit = readLimit(searchParams.get("limit"));

    let lookupName = name;
    let lookupPhone: string | null = phone || null;

    if (customerId) {
      const customer = await storeFindCustomer(pharmacyId, customerId);
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      lookupName = customer.name;
      lookupPhone = customer.phone ?? null;
    }

    if (!lookupName && !lookupPhone) {
      return NextResponse.json(
        { error: "Provide customerId, phone, or name" },
        { status: 400 },
      );
    }

    const history = await fetchRecentSalesForCustomer(
      pharmacyId,
      lookupName || "Walk-in Customer",
      lookupPhone,
      limit,
    );

    return NextResponse.json({ history, recentSales: history });
  } catch (error) {
    console.error("GET /api/customers/history", error);
    return NextResponse.json(
      { error: "Failed to load customer history" },
      { status: 500 },
    );
  }
}
