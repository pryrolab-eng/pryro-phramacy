import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  escapeIlikePattern,
  MIN_GLOBAL_SEARCH_LENGTH,
} from "@/lib/search/escape-ilike";
import type { PharmacyGlobalSearchResult } from "@/lib/search/types";

const EMPTY: PharmacyGlobalSearchResult = {
  customers: [],
  products: [],
  prescriptions: [],
  sales: [],
};

export async function GET(request: NextRequest) {
  try {
    const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (raw.length < MIN_GLOBAL_SEARCH_LENGTH) {
      return NextResponse.json(EMPTY);
    }

    const pattern = escapeIlikePattern(raw);
    if (pattern.length < MIN_GLOBAL_SEARCH_LENGTH) {
      return NextResponse.json(EMPTY);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(EMPTY);
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const like = `%${pattern}%`;

    const [customersResult, medsResult, prescriptionsResult, salesResult] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id, name, phone")
          .eq("pharmacy_id", pharmacyId)
          .or(`name.ilike.${like},phone.ilike.${like}`)
          .limit(6),
        supabase
          .from("medications")
          .select("id, name, category, generic_name")
          .eq("pharmacy_id", pharmacyId)
          .or(`name.ilike.${like},generic_name.ilike.${like}`)
          .limit(6),
        supabase
          .from("prescriptions")
          .select("id, patient_name, doctor_name, status")
          .eq("pharmacy_id", pharmacyId)
          .or(`patient_name.ilike.${like},doctor_name.ilike.${like}`)
          .limit(6),
        supabase
          .from("sales")
          .select("id, receipt_number, customer_name, total_amount")
          .eq("pharmacy_id", pharmacyId)
          .eq("status", "completed")
          .or(
            `receipt_number.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like}`,
          )
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

    if (customersResult.error) {
      console.error("Global search customers:", customersResult.error);
    }
    if (medsResult.error) {
      console.error("Global search medications:", medsResult.error);
    }
    if (prescriptionsResult.error) {
      console.error("Global search prescriptions:", prescriptionsResult.error);
    }
    if (salesResult.error) {
      console.error("Global search sales:", salesResult.error);
    }

    const medicationIds = (medsResult.data ?? []).map((m) => m.id);
    let inventoryByMedication = new Map<string, string>();

    if (medicationIds.length > 0) {
      const { data: inventoryRows } = await supabase
        .from("inventory")
        .select("id, medication_id")
        .eq("pharmacy_id", pharmacyId)
        .in("medication_id", medicationIds)
        .limit(50);

      for (const row of inventoryRows ?? []) {
        if (!inventoryByMedication.has(row.medication_id)) {
          inventoryByMedication.set(row.medication_id, row.id);
        }
      }
    }

    const result: PharmacyGlobalSearchResult = {
      customers: (customersResult.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      })),
      products: (medsResult.data ?? []).map((m) => ({
        id: inventoryByMedication.get(m.id) ?? m.id,
        medicationId: m.id,
        name: m.name,
        category: m.category ?? m.generic_name,
      })),
      prescriptions: (prescriptionsResult.data ?? []).map((p) => ({
        id: p.id,
        patient: p.patient_name,
        doctor: p.doctor_name,
        status: p.status,
      })),
      sales: (salesResult.data ?? []).map((s) => ({
        id: s.id,
        receiptNumber: s.receipt_number,
        customerName: s.customer_name,
        totalAmount: s.total_amount,
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/search", error);
    return NextResponse.json(EMPTY);
  }
}
