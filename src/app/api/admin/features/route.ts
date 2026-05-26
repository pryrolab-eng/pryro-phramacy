import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { listPlatformFeatures } from "@/lib/subscription/plan-features";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const admin = createServiceClient();
    const features = await listPlatformFeatures(admin, { includeInactive: true });
    return NextResponse.json({ features });
  } catch (error) {
    console.error("GET /api/admin/features", error);
    return NextResponse.json({ error: "Failed to load features" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const admin = createServiceClient();
    const { data, error } = await admin.from("platform_features").insert({
      key: body.key,
      display_name: body.display_name,
      description: body.description ?? null,
      group: body.group ?? "General",
      feature_type: body.feature_type ?? "boolean",
      limit_column: body.limit_column ?? null,
      nav_routes: body.nav_routes ?? [],
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, feature: data });
  } catch (error) {
    console.error("POST /api/admin/features", error);
    return NextResponse.json(
      { success: false, error: "Failed to create feature" },
      { status: 500 },
    );
  }
}
