import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import { storeListInventoryTransfers } from "@/lib/db/inventory-store";
import { transferBranchStock } from "@/lib/pharmacy/transfer-branch-stock";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const transfers = await storeListInventoryTransfers(pharmacyId);

    return NextResponse.json(
      transfers.map((t) => ({
        id: t.id,
        product: t.medication_name,
        quantity: t.quantity,
        from: t.from_branch_id,
        to: t.to_branch_id,
        status: t.status,
        date: t.created_at?.toISOString() ?? null,
      })),
    );
  } catch (error) {
    console.error("GET /api/inventory/transfers", error);
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
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

    const productId = body.productId ?? body.inventoryId;
    const fromBranchId = body.fromBranchId ?? body.from;
    const toBranchId = body.toBranchId ?? body.to;
    const quantity = parseInt(String(body.quantity), 10);

    if (!productId || !fromBranchId || !toBranchId || !Number.isFinite(quantity)) {
      return NextResponse.json(
        {
          success: false,
          error: "productId, fromBranchId, toBranchId, and quantity are required",
        },
        { status: 400 },
      );
    }

    const result = await transferBranchStock({
      pharmacyId,
      inventoryId: productId,
      fromBranchId,
      toBranchId,
      quantity,
    });

    return NextResponse.json({
      success: true,
      newStock: result.sourceStock,
      destinationStock: result.destinationStock,
      transferId: result.transferId,
    });
  } catch (error) {
    console.error("POST /api/inventory/transfers", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create transfer",
      },
      { status: 500 },
    );
  }
}
