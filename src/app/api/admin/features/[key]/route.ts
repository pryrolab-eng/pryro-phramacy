import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { storeUpdatePlatformFeature } from "@/lib/db/plan-features-store";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const body = await request.json();
    const feature = await storeUpdatePlatformFeature(decodeURIComponent(key), {
      ...(body.display_name !== undefined
        ? { displayName: body.display_name }
        : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.group !== undefined ? { group: body.group } : {}),
      ...(body.feature_type !== undefined
        ? { featureType: body.feature_type }
        : {}),
      ...(body.limit_column !== undefined
        ? { limitColumn: body.limit_column }
        : {}),
      ...(body.nav_routes !== undefined
        ? { navRoutes: body.nav_routes }
        : {}),
      ...(body.sort_order !== undefined
        ? { sortOrder: body.sort_order }
        : {}),
      ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
    });

    return NextResponse.json({ success: true, feature });
  } catch (error) {
    console.error("PUT /api/admin/features/[key]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update feature" },
      { status: 500 },
    );
  }
}
