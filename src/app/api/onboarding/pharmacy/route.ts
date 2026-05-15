import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "../../../../../supabase/route-handler";
import { createServiceClient } from "../../../../../supabase/service";

/**
 * Creates the tenant pharmacy and attaches the current user as pharmacy_owner.
 * Uses service role for inserts (after session check) to avoid RLS policies
 * that reference auth.users and break INSERT...RETURNING.
 */
export async function POST(request: NextRequest) {
  const { supabase, json } = createRouteHandlerClient(request);

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceClient();

    const { data: existing } = await admin
      .from("pharmacy_users")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1);

    if (existing?.length) {
      return json({
        success: true,
        pharmacyId: existing[0].pharmacy_id,
        alreadyExists: true,
      });
    }

    const body = await request.json();
    const name = (body.name as string)?.trim();
    const license_number = (
      (body.license_number as string)?.trim() || `LIC-${Date.now()}`
    ).slice(0, 200);
    const city = (body.city as string)?.trim() || "Kigali";
    const address = (body.address as string)?.trim() || null;
    const phone = (body.phone as string)?.trim();
    const email = (body.email as string)?.trim() || user.email || "";

    if (!name || !phone) {
      return json(
        { error: "Pharmacy name and phone are required." },
        { status: 400 }
      );
    }

    await admin.from("users").upsert({
      id: user.id,
      email: user.email ?? email,
      user_id: user.id,
      token_identifier: user.email ?? email,
      name: user.user_metadata?.full_name ?? name,
      full_name: user.user_metadata?.full_name ?? name,
    });

    const { data: pharmacy, error: pharmacyError } = await admin
      .from("pharmacies")
      .insert({
        name,
        license_number,
        owner_id: user.id,
        address,
        phone,
        email,
        city,
        status: "trial",
        subscription_plan: "trial",
      })
      .select("id")
      .single();

    if (pharmacyError || !pharmacy) {
      console.error("Onboarding pharmacy insert:", pharmacyError);
      return json(
        { error: pharmacyError?.message || "Could not create pharmacy." },
        { status: 400 }
      );
    }

    const { error: memberError } = await admin.from("pharmacy_users").insert({
      pharmacy_id: pharmacy.id,
      user_id: user.id,
      role: "pharmacy_owner",
      is_active: true,
    });

    if (memberError) {
      console.error("Onboarding pharmacy_users insert:", memberError);
      await admin.from("pharmacies").delete().eq("id", pharmacy.id);
      return json(
        { error: memberError.message || "Could not link you to the pharmacy." },
        { status: 400 }
      );
    }

    return json({
      success: true,
      pharmacyId: pharmacy.id,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return json({ error: message }, { status: 500 });
  }
}
