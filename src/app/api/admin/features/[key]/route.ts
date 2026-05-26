import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
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
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.group !== undefined) updates.group = body.group;
    if (body.feature_type !== undefined) updates.feature_type = body.feature_type;
    if (body.limit_column !== undefined) updates.limit_column = body.limit_column;
    if (body.nav_routes !== undefined) updates.nav_routes = body.nav_routes;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const admin = createServiceClient();
    const { data, error } = await admin
      .from("platform_features")
      .update(updates)
      .eq("key", decodeURIComponent(key))
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, feature: data });
  } catch (error) {
    console.error("PUT /api/admin/features/[key]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update feature" },
      { status: 500 },
    );
  }
}
