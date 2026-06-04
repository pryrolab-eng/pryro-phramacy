import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { createServiceClient } from "../../../../../supabase/service";
import {
  guardPharmacyFeature,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";

async function summarizeShiftSales(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pharmacyId: string,
  branchId: string,
  cashierId: string,
  openedAt: string,
) {
  const { data: sales } = await supabase
    .from("sales")
    .select("total_amount, payment_method, customer_amount")
    .eq("pharmacy_id", pharmacyId)
    .eq("branch_id", branchId)
    .eq("cashier_id", cashierId)
    .eq("status", "completed")
    .gte("created_at", openedAt);

  let totalSales = 0;
  let cashSales = 0;
  let transactionCount = 0;

  for (const sale of sales ?? []) {
    const amount = Number(sale.customer_amount ?? sale.total_amount) || 0;
    totalSales += amount;
    transactionCount += 1;
    if (sale.payment_method === "cash") {
      cashSales += amount;
    }
  }

  return { totalSales, cashSales, transactionCount };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchId = new URL(request.url).searchParams.get("branchId")?.trim();
    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required" },
        { status: 400 },
      );
    }

    const { pharmacyId } = await guardPharmacyFeature(supabase, user.id, {
      feature: "pos.access",
      branchId,
    });

    const teamView =
      new URL(request.url).searchParams.get("team") === "open";

    if (teamView) {
      const { data: membership } = await supabase
        .from("pharmacy_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("pharmacy_id", pharmacyId)
        .eq("is_active", true)
        .maybeSingle();

      if (membership?.role !== "pharmacy_owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: openShifts, error: teamError } = await supabase
        .from("cashier_shifts")
        .select("id, cashier_id, opened_at, opening_cash, status")
        .eq("pharmacy_id", pharmacyId)
        .eq("branch_id", branchId)
        .eq("status", "open")
        .order("opened_at", { ascending: true });

      if (teamError) throw teamError;

      const cashierIds = Array.from(
        new Set((openShifts ?? []).map((s) => s.cashier_id as string)),
      );
      const nameById = new Map<string, string>();
      if (cashierIds.length > 0) {
        const admin = createServiceClient();
        const { data: profiles } = await admin
          .from("users")
          .select("id, full_name, name, email")
          .in("id", cashierIds);
        for (const p of profiles ?? []) {
          const label =
            p.full_name ||
            p.name ||
            (typeof p.email === "string" ? p.email.split("@")[0] : null) ||
            "Staff";
          nameById.set(p.id as string, label);
        }
      }

      const team = await Promise.all(
        (openShifts ?? []).map(async (row) => {
          const summary = await summarizeShiftSales(
            supabase,
            pharmacyId,
            branchId,
            row.cashier_id as string,
            row.opened_at as string,
          );
          return {
            id: row.id,
            cashierId: row.cashier_id,
            cashierName: nameById.get(row.cashier_id as string) ?? "Staff",
            openedAt: row.opened_at,
            openingCash: Number(row.opening_cash),
            isCurrentUser: row.cashier_id === user.id,
            liveTotalSales: summary.totalSales,
            liveTransactionCount: summary.transactionCount,
          };
        }),
      );

      return NextResponse.json({ team });
    }

    const { data: shift, error } = await supabase
      .from("cashier_shifts")
      .select("*")
      .eq("pharmacy_id", pharmacyId)
      .eq("branch_id", branchId)
      .eq("cashier_id", user.id)
      .eq("status", "open")
      .maybeSingle();

    if (error) throw error;

    if (!shift) {
      return NextResponse.json({ shift: null });
    }

    const summary = await summarizeShiftSales(
      supabase,
      pharmacyId,
      branchId,
      user.id,
      shift.opened_at,
    );

    return NextResponse.json({
      shift: {
        ...shift,
        liveTotalSales: summary.totalSales,
        liveCashSales: summary.cashSales,
        liveTransactionCount: summary.transactionCount,
        expectedCash:
          Number(shift.opening_cash) + summary.cashSales,
      },
    });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    return NextResponse.json({ error: "Failed to load shift" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as "open" | "close";
    const branchId = body.branchId as string | undefined;

    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required" },
        { status: 400 },
      );
    }

    const { pharmacyId } = await guardPharmacyFeature(supabase, user.id, {
      feature: "pos.access",
      branchId,
    });

    if (action === "open") {
      const openingCash = Number(body.openingCash) || 0;

      const { data: existing } = await supabase
        .from("cashier_shifts")
        .select("id")
        .eq("cashier_id", user.id)
        .eq("branch_id", branchId)
        .eq("status", "open")
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "You already have an open shift for this branch" },
          { status: 400 },
        );
      }

      const { data: shift, error } = await supabase
        .from("cashier_shifts")
        .insert({
          pharmacy_id: pharmacyId,
          branch_id: branchId,
          cashier_id: user.id,
          opening_cash: openingCash,
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, shift });
    }

    if (action === "close") {
      const shiftId = body.shiftId as string | undefined;
      const actualCash = Number(body.actualCash);
      const closeNotes = (body.closeNotes as string) || null;

      if (!shiftId || Number.isNaN(actualCash)) {
        return NextResponse.json(
          { error: "shiftId and actualCash are required to close" },
          { status: 400 },
        );
      }

      const { data: shift, error: shiftError } = await supabase
        .from("cashier_shifts")
        .select("*")
        .eq("id", shiftId)
        .eq("cashier_id", user.id)
        .eq("status", "open")
        .single();

      if (shiftError || !shift) {
        return NextResponse.json(
          { error: "Open shift not found" },
          { status: 404 },
        );
      }

      const summary = await summarizeShiftSales(
        supabase,
        pharmacyId,
        branchId,
        user.id,
        shift.opened_at,
      );

      const expectedCash =
        Number(shift.opening_cash) + summary.cashSales;
      const variance = actualCash - expectedCash;

      const { data: closed, error: closeError } = await supabase
        .from("cashier_shifts")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          expected_cash: expectedCash,
          actual_cash: actualCash,
          cash_variance: variance,
          total_sales: summary.totalSales,
          transaction_count: summary.transactionCount,
          close_notes: closeNotes,
        })
        .eq("id", shiftId)
        .select()
        .single();

      if (closeError) throw closeError;

      return NextResponse.json({
        success: true,
        shift: closed,
        summary: {
          expectedCash,
          actualCash,
          variance,
          totalSales: summary.totalSales,
          cashSales: summary.cashSales,
          transactionCount: summary.transactionCount,
          totalRefunds: Number(shift.total_refunds ?? 0),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("POST /api/pos/shifts", error);
    const message =
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Shift action failed";
    const isRls = message.includes("row-level security");
    return NextResponse.json(
      {
        error: isRls
          ? "Could not save shift (database access). Run the latest Supabase migrations, then try again."
          : message,
      },
      { status: 500 },
    );
  }
}
