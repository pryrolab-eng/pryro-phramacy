import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  deletePharmacyCategoryFromDb,
  updatePharmacyCategoryFromDb,
} from "@/lib/db/categories-pharmacy";
import { prisma } from "@/lib/db/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);

    const result = await updatePharmacyCategoryFromDb({
      pharmacyId,
      categoryId: id,
      name: body.name,
      description: body.description,
      isActive: body.status === "Active",
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    const category = await prisma.categories.findFirst({
      where: { id, pharmacy_id: pharmacyId },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 },
    );
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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const result = await deletePharmacyCategoryFromDb({
      pharmacyId,
      categoryId: id,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
