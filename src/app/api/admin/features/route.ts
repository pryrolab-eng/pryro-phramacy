import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  storeCreatePlatformFeature,
  storeListPlatformFeatures,
} from "@/lib/db/plan-features-store";

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const features = await storeListPlatformFeatures({ includeInactive: true });
    return NextResponse.json({ features });
  } catch (error) {
    console.error("GET /api/admin/features", error);
    return NextResponse.json({ error: "Failed to load features" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const body = await request.json();
    const feature = await storeCreatePlatformFeature({
      key: body.key,
      displayName: body.display_name,
      description: body.description ?? null,
      group: body.group ?? "General",
      featureType: body.feature_type ?? "boolean",
      limitColumn: body.limit_column ?? null,
      navRoutes: body.nav_routes ?? [],
      sortOrder: body.sort_order ?? 0,
      isActive: body.is_active ?? true,
    });

    return NextResponse.json({ success: true, feature });
  } catch (error) {
    console.error("POST /api/admin/features", error);
    return NextResponse.json(
      { success: false, error: "Failed to create feature" },
      { status: 500 },
    );
  }
}
