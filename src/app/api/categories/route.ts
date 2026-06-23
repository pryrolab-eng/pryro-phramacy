import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { listCategoryCatalog } from "@/lib/pharmacy/category-catalog";
import { createPharmacyCategoryFromDb } from "@/lib/db/categories-pharmacy";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const categories = await listCategoryCatalog(pharmacyId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load categories";
    const status = message.includes("Pharmacy not found") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const pharmacyId = await requireSessionPharmacyId(user.id);
    const name = String(body.name || body.categoryName || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    const category = await createPharmacyCategoryFromDb({
      pharmacyId,
      name,
      description: body.description || body.categoryDescription || "",
    });

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        is_active: category.is_active,
        pharmacy_id: category.pharmacy_id,
      },
    });
  } catch (error) {
    console.error("Category add error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add category" },
      { status: 500 },
    );
  }
}
