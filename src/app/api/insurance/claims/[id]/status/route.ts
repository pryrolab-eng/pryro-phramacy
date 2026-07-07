import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/prisma";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "approved", "rejected"],
  processing: ["approved", "rejected"],
  approved: [],
  rejected: ["pending"],
};

const VALID_STATUSES = ["pending", "processing", "approved", "rejected"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: claimId } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.reportsView);
    const pharmacyId = await requireUserPharmacyId(user.id);

    const body = await request.json();
    const { status, notes, approvedAmount } = body as {
      status?: string;
      notes?: string;
      approvedAmount?: number;
    };

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { success: false, error: "status is required" },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const claim = await prisma.insurance_claims.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        pharmacy_id: true,
        status: true,
        claim_amount: true,
        patient_name: true,
      },
    });

    if (!claim || claim.pharmacy_id !== pharmacyId) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 },
      );
    }

    const currentStatus = claim.status ?? "pending";
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from "${currentStatus}" to "${status}". Allowed: ${allowed.length > 0 ? allowed.join(", ") : "none (terminal state)"}`,
        },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date(),
    };

    if (status === "approved" || status === "rejected") {
      updateData.processed_at = new Date();
    }

    if (status === "approved" && approvedAmount !== undefined) {
      updateData.approved_amount = approvedAmount;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.insurance_claims.update({
      where: { id: claimId },
      data: updateData,
    });

    await writeAuditLog({
      pharmacyId,
      userId: user.id,
      action: "UPDATE",
      tableName: "insurance_claims",
      recordId: claimId,
      oldValues: { status: currentStatus },
      newValues: {
        status,
        ...(notes ? { notes } : {}),
        ...(approvedAmount !== undefined ? { approved_amount: approvedAmount } : {}),
      },
      ...auditRequestMetadata(request),
    });

    return NextResponse.json({
      success: true,
      claim: {
        id: updated.id,
        status: updated.status,
        approved_amount: updated.approved_amount,
        processed_at: updated.processed_at?.toISOString() ?? null,
        notes: updated.notes,
      },
    });
  } catch (error) {
    const forbidden = permissionErrorResponse(error);
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status });
    }
    console.error("PATCH /api/insurance/claims/[id]/status", error);
    return NextResponse.json(
      { success: false, error: "Failed to update claim status" },
      { status: 500 },
    );
  }
}
