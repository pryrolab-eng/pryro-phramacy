import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { requireUserBranchId } from "@/lib/pharmacy/get-session-branch";
import {
  entitlementRouteResponse,
  guardInventoryAccessForUser,
} from "@/lib/subscription/route-guards";
import { storeBatchImportInventory } from "@/lib/db/inventory-store";
import { MAX_IMPORT_ROWS } from "@/lib/import/types";

type ImportBody = {
  rows?: Array<{
    name: string;
    category: string;
    batch_number: string;
    quantity: number;
    unit_cost?: number;
    selling_price: number;
    minimum_stock_level: number;
    expiry_date: string;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" });
    }

    try {
      await guardInventoryAccessForUser(user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const branchId = await requireUserBranchId(user.id);
    const body = (await request.json()) as ImportBody;
    const rows = body.rows ?? [];

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No rows to import",
      });
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json({
        success: false,
        error: `Import limited to ${MAX_IMPORT_ROWS} rows per batch`,
      });
    }

    const result = await storeBatchImportInventory({
      pharmacyId,
      branchId,
      rows: rows.map((row) => ({
        name: String(row.name ?? "").trim(),
        category: String(row.category ?? "").trim(),
        batch_number: String(row.batch_number ?? "BATCH001").trim(),
        quantity: Number(row.quantity) || 0,
        unit_cost: Number(row.unit_cost) || 0,
        selling_price: Number(row.selling_price) || 0,
        minimum_stock_level: Number(row.minimum_stock_level) || 0,
        expiry_date: String(row.expiry_date ?? "").trim(),
      })),
    });

    return NextResponse.json({
      success: result.failures.length === 0,
      ...result,
    });
  } catch (error) {
    console.error("POST /api/inventory/import", error);
    return NextResponse.json({
      success: false,
      error: "Failed to import inventory",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
