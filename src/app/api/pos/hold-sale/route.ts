import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserBranchId } from "@/lib/pharmacy/get-session-branch";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import {
  storeCreateHeldSale,
  storeListHeldSales,
} from "@/lib/db/pos-store";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const branchId =
      typeof body.branchId === "string"
        ? body.branchId
        : await requireUserBranchId(user.id);

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
      branchId,
    });

    const heldSale = await storeCreateHeldSale({
      pharmacyId,
      branchId,
      cashierId: user.id,
      customer: body.customer ?? null,
      cart: body.cart ?? [],
    });

    return NextResponse.json({
      success: true,
      heldSale: {
        id: heldSale.id,
        cart: body.cart,
        customer: body.customer,
        timestamp: heldSale.created_at,
      },
    });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("POST /api/pos/hold-sale", error);
    return NextResponse.json({ error: "Failed to hold sale" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get("branchId")?.trim();

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
      branchId: branchParam || undefined,
    });

    let branchId = branchParam;
    if (!branchId) {
      try {
        branchId = await requireUserBranchId(user.id);
      } catch {
        branchId = undefined;
      }
    }

    const rows = await storeListHeldSales({
      pharmacyId,
      branchId,
      cashierId: user.id,
    });

    return NextResponse.json(
      rows.map((row) => {
        const cart = Array.isArray(row.cart) ? row.cart : [];
        return {
          id: row.id,
          customer: row.customer ?? null,
          items: cart.length,
          cart,
          timestamp: row.created_at,
        };
      }),
    );
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("GET /api/pos/hold-sale", error);
    return NextResponse.json([]);
  }
}
