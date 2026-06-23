import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import { storeLookupPosCustomersByPhone } from "@/lib/db/customers-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone")?.trim() ?? "";
    if (!phone) {
      return NextResponse.json([]);
    }

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
    });

    const results = await storeLookupPosCustomersByPhone(pharmacyId, phone);
    return NextResponse.json(results);
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("GET /api/pos/customer-lookup", error);
    return NextResponse.json([]);
  }
}
