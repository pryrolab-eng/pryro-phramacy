import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
  if (!allowed) {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden: platform admin access required" },
        { status: 403 }
      ),
    };
  }

  return { db: createServiceClient() };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth && auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.price !== undefined) updates.price = body.price;
    if (body.period !== undefined) updates.period = body.period;
    if (body.features !== undefined) updates.features = body.features;
    if (body.is_popular !== undefined) updates.is_popular = body.is_popular;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: plan, error } = await auth.db
      .from("subscription_plans")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("PUT /api/admin/plans/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
