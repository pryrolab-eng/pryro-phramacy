import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { createPharmacyCategoryFromDb } from "@/lib/db/categories-pharmacy";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const pharmacyId = await requireUserPharmacyId(user.id);
    const name = String(body.categoryName || body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    const category = await createPharmacyCategoryFromDb({
      pharmacyId,
      name,
      description: body.categoryDescription || body.description || "",
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Quick add category error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add category" },
      { status: 500 },
    );
  }
}
