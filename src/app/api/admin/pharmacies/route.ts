import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isFreePlanPrice } from "@/lib/admin/plan-stats";
import { planNameToEnum } from "@/lib/subscription/plan-enum";
import {
  isBranchAddonCatalogName,
  isMainTierCatalogRow,
} from "@/lib/subscription/normalize-plan";
import { resolveSubscriptionPlanEnum } from "@/lib/admin/resolve-subscription-plan-enum";

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

    const [{ data: pharmacies, error }, subsResult, branchSubsResult] =
      await Promise.all([
      supabase
        .from("pharmacies")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select(
          "pharmacy_id, plan, status, subscription_type, subscription_plans!plan_id(name, price, plan_type)",
        )
        .eq("status", "active")
        .eq("subscription_type", "main"),
      supabase
        .from("subscriptions")
        .select("pharmacy_id")
        .eq("status", "active")
        .eq("subscription_type", "branch_addon"),
    ]);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json([]);
    }

    if (subsResult.error) {
      console.warn("Active main subscriptions lookup:", subsResult.error);
    }

    const branchAddonCountByPharmacy = new Map<string, number>();
    for (const row of branchSubsResult.data ?? []) {
      const pharmacyId = (row as { pharmacy_id?: string | null }).pharmacy_id;
      if (!pharmacyId) continue;
      branchAddonCountByPharmacy.set(
        pharmacyId,
        (branchAddonCountByPharmacy.get(pharmacyId) ?? 0) + 1,
      );
    }

    type SubPlan = { name: string; price: number };
    const subPlanByPharmacy = new Map<string, SubPlan>();
    for (const row of subsResult.data ?? []) {
      const pharmacyId = (row as { pharmacy_id?: string | null }).pharmacy_id;
      if (!pharmacyId) continue;
      const embedded = (row as {
        subscription_plans?: {
          name?: string;
          price?: unknown;
          plan_type?: string;
        } | null;
      }).subscription_plans;
      if (!embedded || !isMainTierCatalogRow(embedded)) continue;
      const name = embedded.name?.trim();
      if (!name || isBranchAddonCatalogName(name)) continue;
      subPlanByPharmacy.set(pharmacyId, {
        name,
        price: Number(embedded.price ?? 0),
      });
    }

    const { data: catalogPlans } = await supabase
      .from("subscription_plans")
      .select("name, price, plan_type")
      .eq("is_active", true);

    const mainCatalogPlans = (catalogPlans ?? []).filter((row) =>
      isMainTierCatalogRow(row as { name?: string; plan_type?: string }),
    );

    const priceByCatalogName = new Map<string, number>();
    for (const row of mainCatalogPlans) {
      const n = String((row as { name?: string }).name ?? "").trim().toLowerCase();
      if (n) {
        priceByCatalogName.set(n, Number((row as { price?: unknown }).price ?? 0));
      }
    }

    const enriched = (pharmacies ?? []).map((p) => {
      const id = String((p as { id?: string }).id ?? "");
      const sub = subPlanByPharmacy.get(id);
      const enumKey = planNameToEnum(
        String((p as { subscription_plan?: string }).subscription_plan ?? ""),
      );
      const fallbackPlan = mainCatalogPlans.find(
        (c) =>
          planNameToEnum(String((c as { name?: string }).name)) === enumKey,
      ) as { name?: string } | undefined;

      let catalog_plan_name =
        sub?.name ??
        (fallbackPlan?.name ? String(fallbackPlan.name) : null);
      if (catalog_plan_name && isBranchAddonCatalogName(catalog_plan_name)) {
        catalog_plan_name = fallbackPlan?.name
          ? String(fallbackPlan.name)
          : null;
      }

      let catalog_plan_price: number | null = sub?.price ?? null;
      if (catalog_plan_price == null && catalog_plan_name) {
        catalog_plan_price =
          priceByCatalogName.get(catalog_plan_name.toLowerCase()) ?? null;
      }

      const is_free_plan =
        catalog_plan_price != null
          ? isFreePlanPrice(catalog_plan_price)
          : enumKey === "trial";

      const rawStatus = String((p as { status?: string }).status ?? "active");
      /** Legacy: status `trial` meant free plan, not blocked access. */
      const status = rawStatus === "trial" ? "active" : rawStatus;

      const branch_addons_active =
        branchAddonCountByPharmacy.get(id) ?? 0;

      return {
        ...p,
        status,
        branch_addons_active,
        ...(catalog_plan_name
          ? {
              catalog_plan_name,
              catalog_plan_price,
              is_free_plan,
            }
          : { is_free_plan: enumKey === "trial" }),
      };
    });

    return NextResponse.json(enriched);
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
    const subscriptionPlan = await resolveSubscriptionPlanEnum(
      supabase,
      body.subscription_plan as string,
    );

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
