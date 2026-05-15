import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data: pharmacies, error } = await supabase
      .from("pharmacies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(pharmacies || []);
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    const ownerEmail = (body.owner_email as string)?.trim();
    const ownerPassword = body.owner_password as string;
    const ownerName = (body.owner_name as string)?.trim() || "";

    if (!ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { success: false, error: "Owner email and password are required." },
        { status: 400 }
      );
    }

    if (ownerPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Owner password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
        user_metadata: { full_name: ownerName },
      });

    if (authError || !authUser.user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        {
          success: false,
          error: `User creation failed: ${authError?.message ?? "Unknown error"}`,
        },
        { status: 400 }
      );
    }

    const pharmacyEmail =
      (body.email as string)?.trim() || ownerEmail;
    const plan = body.subscription_plan as string;
    const subscriptionPlan =
      plan === "free" || !plan ? "trial" : plan;

    const { data: pharmacy, error: pharmacyError } = await supabase
      .from("pharmacies")
      .insert({
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: pharmacyEmail,
        license_number: body.license_number || `LIC-${Date.now()}`,
        subscription_plan: subscriptionPlan,
        status: "active",
        owner_id: authUser.user.id,
      })
      .select()
      .single();

    if (pharmacyError || !pharmacy) {
      console.error("Pharmacy creation error:", pharmacyError);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        {
          success: false,
          error: `Pharmacy creation failed: ${pharmacyError?.message ?? "Unknown error"}`,
        },
        { status: 400 }
      );
    }

    await supabase.from("users").upsert({
      id: authUser.user.id,
      email: ownerEmail,
      name: ownerName,
      full_name: ownerName,
      user_id: authUser.user.id,
      token_identifier: ownerEmail,
    });

    const { error: memberError } = await supabase
      .from("pharmacy_users")
      .insert({
        user_id: authUser.user.id,
        pharmacy_id: pharmacy.id,
        role: "pharmacy_owner",
        is_active: true,
      });

    if (memberError) {
      console.error("pharmacy_users insert error:", memberError);
      await supabase.from("pharmacies").delete().eq("id", pharmacy.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        {
          success: false,
          error: `Could not link owner to pharmacy: ${memberError.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      pharmacy,
      owner: {
        email: ownerEmail,
        message:
          "Share the owner email and password with the pharmacy owner for sign-in.",
      },
    });
  } catch (error) {
    console.error("Error creating pharmacy:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create pharmacy";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
