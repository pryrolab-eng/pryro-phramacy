import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  storeCreateGlobalCategory,
  storeListGlobalCategories,
} from "@/lib/db/admin-store";

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const categories = await storeListGlobalCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const category = await storeCreateGlobalCategory({
      name: body.name || body.categoryName,
      description: body.description || body.categoryDescription || "",
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Category add error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add category" },
      { status: 500 },
    );
  }
}
