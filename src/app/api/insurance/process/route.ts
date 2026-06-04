import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { insertInsuranceClaimLines } from "@/lib/insurance/claim-lines";
import { computeInsuranceCoverage } from "@/lib/insurance/coverage-engine";
import type { CoverageLineResult } from "@/lib/insurance/types";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { createServiceClient } from "../../../../../supabase/service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const body = await request.json();
    const admin = createServiceClient();

    const provider = await resolveInsuranceProvider(
      admin,
      pharmacyId,
      String(body.insuranceType ?? body.insurance ?? ""),
    );

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Insurance provider not found" },
        { status: 404 },
      );
    }

    const lines = Array.isArray(body.lines) ? body.lines : [];
    let insuranceCoverage = Number(body.insuranceCoverage) || 0;
    let patientCopay = Number(body.patientCopay ?? body.patientAmount) || 0;
    let subtotal = Number(body.totalAmount ?? body.subtotal) || 0;
    let coverageLines: CoverageLineResult[] = [];

    if (lines.length > 0) {
      const totals = await computeInsuranceCoverage(admin, {
        pharmacyId,
        providerIdOrName: provider.id,
        lines: lines.map(
          (line: {
            medicationId?: string;
            quantity?: number;
            shelfUnitPrice?: number;
            price?: number;
            medicationName?: string;
            inventoryId?: string;
          }) => ({
            medicationId: String(line.medicationId ?? ""),
            quantity: Number(line.quantity) || 1,
            shelfUnitPrice: Number(line.shelfUnitPrice ?? line.price) || 0,
            medicationName: line.medicationName,
            inventoryId: line.inventoryId,
          }),
        ),
      });
      if (totals) {
        insuranceCoverage = totals.insuranceCoverage;
        patientCopay = totals.patientCopay;
        subtotal = totals.subtotal;
        coverageLines = totals.lines;
      }
    }

    const metadata =
      body.metadata && typeof body.metadata === "object"
        ? body.metadata
        : {
            tinInsurance: body.tinInsurance,
            ordonnanceNumber: body.ordonnanceNumber,
            prescriberName: body.prescriberName,
            hsp: body.hsp,
            physicianOrderNumber: body.physicianOrderNumber,
            tinPatient: body.tinPatient,
            amountPaid: body.amountPaid,
            paymentType: body.paymentType,
            transactionId: body.transactionId,
            validityRate: body.validityRate,
          };

    const { data: claim, error } = await admin
      .from("insurance_claims")
      .insert({
        pharmacy_id: pharmacyId,
        sale_id: body.saleId ?? null,
        insurance_provider_id: provider.id,
        patient_name: String(body.patientName ?? body.clientName ?? "Unknown"),
        patient_id_number: String(
          body.patientId ?? body.patient_id ?? body.patientNumber ?? "",
        ),
        claim_amount: insuranceCoverage,
        covered_amount: insuranceCoverage,
        patient_copay: patientCopay,
        approved_amount: 0,
        status: "pending",
        notes: body.notes ?? null,
        metadata,
      })
      .select("id, claim_number, status")
      .single();

    if (error) {
      console.error("Insurance claim insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    if (claim && coverageLines.length > 0) {
      await insertInsuranceClaimLines(admin, {
        claimId: claim.id,
        pharmacyId,
        providerId: provider.id,
        lines: coverageLines,
      });
    }

    return NextResponse.json({
      success: true,
      claim: {
        claimId: claim?.id,
        claimNumber: claim?.claim_number,
        approvalCode: claim?.claim_number,
        status: claim?.status,
      },
      totals: { subtotal, insuranceCoverage, patientCopay },
      message: "Insurance claim saved",
    });
  } catch (error) {
    console.error("Insurance processing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process insurance claim" },
      { status: 500 },
    );
  }
}
