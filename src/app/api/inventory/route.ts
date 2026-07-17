import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserBranchId, resolveRequestBranchScope } from "@/lib/pharmacy/get-session-branch";
import { parseBranchScopeFromRequest } from "@/lib/pharmacy/branch-scope";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import {
  storeCreateInventory,
  storeListInventory,
} from "@/lib/db/inventory-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    const scope = parseBranchScopeFromRequest(request);
    const { pharmacyId, branchId } = await resolveRequestBranchScope(
      user.id,
      scope.branchId,
    );
    const items = await storeListInventory(pharmacyId, branchId);
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/inventory", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" });
    }

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "inventory.access",
    });
    const branchId = await requireUserBranchId(user.id);
    const body = await request.json();

    const inventory = await storeCreateInventory({
      pharmacyId,
      branchId,
      medicationId: body.medication_id,
      batchNumber: body.batch_number,
      quantity: body.quantity,
      unitCost: body.unit_cost,
      sellingPrice: body.selling_price,
      minimumStockLevel: body.minimum_stock_level,
      expiryDate: body.expiry_date,
      stockLocation:
        body.stockLocation ?? body.stock_location ?? body.stock_location_id,
    });

    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "INSERT",
      tableName: "inventory",
      recordId: typeof inventory.id === "string" ? inventory.id : undefined,
      newValues: inventory,
      ...auditRequestMetadata(request),
    });

    return NextResponse.json({ success: true, inventory });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("POST /api/inventory", error);
    return NextResponse.json({ success: false, error: "Failed to create inventory" });
  }
}

