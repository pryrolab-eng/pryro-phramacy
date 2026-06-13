import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeCreateDiscount,
  storeListActiveDiscounts,
} from "@/lib/db/discounts-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const discounts = await storeListActiveDiscounts(pharmacyId);

    return NextResponse.json(
      discounts.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        value: d.value,
        active: d.is_active,
      })),
    );
  } catch (error) {
    console.error("GET /api/pos/discounts", error);
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = await request.json();

    const discount = await storeCreateDiscount({
      pharmacyId: (body.pharmacy_id as string) || pharmacyId,
      name: body.name,
      type: body.type,
      value: Number(body.value) || 0,
    });

    return NextResponse.json({ success: true, discount });
  } catch (error) {
    console.error("POST /api/pos/discounts", error);
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }
}
