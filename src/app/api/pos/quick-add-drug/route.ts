import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { requireUserBranchId } from "@/lib/pharmacy/get-session-branch";
import { storeQuickAddPosDrug } from "@/lib/db/pos-store";

function readString(body: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readNumber(body: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = body[key];
    if (value === undefined || value === null || value === "") continue;
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const branchId = await requireUserBranchId(user.id);

    const body = (await request.json()) as Record<string, unknown>;
    const name = readString(body, "productName", "name");
    const category = readString(body, "category");

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Product name is required" },
        { status: 400 },
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 },
      );
    }

    const { medication, inventory } = await storeQuickAddPosDrug({
      pharmacyId,
      branchId,
      name,
      category,
      manufacturer: readString(body, "manufacturer") || null,
      barcode: readString(body, "barcode") || null,
      batchNumber:
        readString(body, "batchNumber", "batch_number") || "BATCH001",
      quantityInStock: readNumber(body, "initialStock", "initial_stock"),
      unitCost: readNumber(body, "purchasePrice", "purchase_price"),
      sellingPrice: readNumber(body, "unitPrice", "unit_price"),
      minimumStockLevel: readNumber(
        body,
        "minStockAlert",
        "min_stock",
        "minimum_stock_level",
      ),
      expiryDate: readString(body, "expiryDate", "expiry_date") || null,
      stockLocation:
        readString(body, "stockLocation", "stock_location", "stock_location_id") ||
        null,
    });

    return NextResponse.json({ success: true, medication, inventory });
  } catch (error) {
    console.error("Quick add product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
