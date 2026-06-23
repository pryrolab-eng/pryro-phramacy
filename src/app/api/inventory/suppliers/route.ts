import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import {
  storeCreateSupplier,
  storeListActiveSuppliers,
} from "@/lib/db/inventory-store";

export async function GET() {
  try {
    const suppliers = await storeListActiveSuppliers();
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("GET /api/inventory/suppliers", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
      await guardInventoryAccessForUser(user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = await request.json();
    const supplier = await storeCreateSupplier({
      pharmacyId,
      name: body.name,
      contactPerson: body.contact,
      phone: body.phone,
      email: body.email,
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("POST /api/inventory/suppliers", error);
    return NextResponse.json({ success: false, error: "Failed to create supplier" }, { status: 500 });
  }
}
