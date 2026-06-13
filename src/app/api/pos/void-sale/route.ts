import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import { storeVoidPosSale } from "@/lib/db/pos-store";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { saleId, reason } = await request.json();
    if (!saleId) {
      return NextResponse.json({ error: "saleId is required" }, { status: 400 });
    }

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
    });

    const voidedSale = await storeVoidPosSale({
      pharmacyId,
      saleId,
      reason: typeof reason === "string" ? reason : "User requested",
      voidedBy: user.id,
    });

    if (!voidedSale) {
      return NextResponse.json(
        { error: "Sale not found or already voided" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      voidedSale: {
        id: saleId,
        voidedAt: new Date().toISOString(),
        reason,
        status: "cancelled",
      },
    });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;

    const message =
      error instanceof Error ? error.message : "Failed to void sale";
    const status = message.includes("returns") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
