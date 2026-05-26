import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAdminPharmacyDetail } from "@/lib/admin/pharmacy-detail";
import { resolveSubscriptionPlanEnum } from "@/lib/admin/resolve-subscription-plan-enum";
import { createClient as createAuthClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import type { CatalogPlanLike } from "@/lib/admin/plan-stats";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await auth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(auth, user.id, null);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createServiceClient();
    const { data: catalogRows } = await admin
      .from("subscription_plans")
      .select("id, name, price, plan_type")
      .eq("is_active", true);

    const detail = await buildAdminPharmacyDetail(
      admin,
      id,
      (catalogRows ?? []) as CatalogPlanLike[],
    );

    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, detail });
  } catch (e) {
    console.error("GET /api/admin/pharmacies/[id]", e);
    return NextResponse.json(
      { error: "Failed to load pharmacy detail" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    const subscriptionPlan = await resolveSubscriptionPlanEnum(
      supabase,
      body.subscription_plan as string | undefined,
    )

    // Get current pharmacy to find owner_id
    const { data: currentPharmacy } = await supabase
      .from('pharmacies')
      .select('owner_id, email, status')
      .eq('id', id)
      .single()
    
    const nextStatus =
      body.status === 'suspended' || body.status === 'inactive'
        ? body.status
        : 'active'

    // Update pharmacy information
    const { data: pharmacy, error } = await supabase
      .from('pharmacies')
      .update({
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        license_number: body.license_number,
        subscription_plan: subscriptionPlan,
        status: nextStatus,
        owner_name: body.owner_name,
        owner_email: body.owner_email || body.email
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update user password if provided
    if (body.new_password && currentPharmacy?.owner_id) {
      try {
        await supabase.auth.admin.updateUserById(currentPharmacy.owner_id, {
          password: body.new_password
        })
      } catch (passwordError) {
        console.error('Password update failed:', passwordError)
        // Continue with pharmacy update even if password update fails
      }
    }

    // Update user email if changed
    if (body.owner_email && body.owner_email !== currentPharmacy?.email && currentPharmacy?.owner_id) {
      try {
        await supabase.auth.admin.updateUserById(currentPharmacy.owner_id, {
          email: body.owner_email
        })
      } catch (emailError) {
        console.error('Email update failed:', emailError)
        // Continue with pharmacy update even if email update fails
      }
    }

    // Update profile if exists
    if (currentPharmacy?.owner_id) {
      try {
        await supabase.from('profiles').upsert({
          id: currentPharmacy.owner_id,
          full_name: body.owner_name,
          email: body.owner_email || body.email,
          phone: body.phone
        })
      } catch (profileError) {
        console.log('Profile update skipped:', profileError)
      }
    }

    return NextResponse.json({ success: true, pharmacy })
  } catch (error) {
    console.error('Error updating pharmacy:', error)
    return NextResponse.json({ success: false, error: 'Failed to update pharmacy' })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Prevent deleting a pharmacy that still has active/pending subscriptions.
    const { data: subs, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, status, subscription_type, is_active")
      .eq("pharmacy_id", id)
      .in("status", ["active", "pending_payment", "pending", "scheduled_change"])
      .limit(1);

    if (subsErr) {
      return NextResponse.json(
        { success: false, error: "Failed to validate subscriptions before delete." },
        { status: 500 },
      );
    }

    if ((subs ?? []).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete this pharmacy because it has active or pending subscriptions. Cancel subscriptions first.",
        },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('pharmacies')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pharmacy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete pharmacy' },
      { status: 500 },
    )
  }
}