import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import {
  storeDeleteInventory,
  storeUpdateInventory,
} from "@/lib/db/inventory-store";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const body = await request.json();
    await storeUpdateInventory(id, {
      quantity: body.quantity,
      selling_price: body.selling_price,
      minimum_stock_level: body.minimum_stock_level,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/inventory/[id]", error);
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    await storeDeleteInventory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/inventory/[id]", error);
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}
