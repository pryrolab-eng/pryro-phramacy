import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";

import { insertInsuranceClaimLines } from "@/lib/insurance/claim-lines";
import { computeInsuranceCoverage } from "@/lib/insurance/coverage-engine";
import type { CoverageLineResult } from "@/lib/insurance/types";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { storeCreateInsuranceClaim } from "@/lib/db/insurance-store";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = await request.json();

    const provider = await resolveInsuranceProvider(
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
      const totals = await computeInsuranceCoverage({
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

    const claim = await storeCreateInsuranceClaim({
      pharmacyId,
      saleId: body.saleId ?? null,
      providerId: provider.id,
      patientName: String(body.patientName ?? body.clientName ?? "Unknown"),
      patientIdNumber: String(
        body.patientId ?? body.patient_id ?? body.patientNumber ?? "",
      ),
      claimAmount: insuranceCoverage,
      coveredAmount: insuranceCoverage,
      patientCopay,
      notes: body.notes ?? null,
      metadata,
    });

    if (claim && coverageLines.length > 0) {
      await insertInsuranceClaimLines({
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
