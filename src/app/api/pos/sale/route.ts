import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { cacheDelByPrefix } from "@/lib/cache/redis-cache";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import {
  entitlementRouteResponse,
  guardPosInsuranceForUser,
} from "@/lib/subscription/route-guards";
import {
  cartHasNearExpiry,
  computeDaysToExpiry,
  isExpired,
  validateNoExpiredInCart,
  validatePrescriptionForSale,
  type PrescriptionConfirmation,
} from "@/lib/pos/pharmacy-rules";
import {
  SHIFT_REQUIRED_CODE,
  SHIFT_REQUIRED_MESSAGE,
} from "@/lib/pos/cashier-shift";
import { storeFetchOpenCashierShift } from "@/lib/db/cashier-shifts-store";
import { emitNotificationEvent } from "@/lib/notifications/emit";
import {
  mapPaymentMethodToDb,
  storeCreatePosSale,
  storeGetInventoryForSale,
} from "@/lib/db/pos-store";
import { storeCreateInsuranceClaim } from "@/lib/db/insurance-store";
import { computeInsuranceCoverage } from "@/lib/insurance/coverage-engine";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { insertInsuranceClaimLines } from "@/lib/insurance/claim-lines";
import { awardLoyaltyForSale } from "@/lib/loyalty/award-on-sale";
import {
  resolveInsuranceClaimPatientName,
  resolvePayerDisplayName,
  resolveSalePatientName,
} from "@/lib/sales/resolve-sale-parties";
import { submitPharmacySaleToEbm } from "@/lib/ebm/submit-sale";
import { dispatchIntegrationWebhookEvent } from "@/lib/integrations/v1/webhook-deliver";
import { prisma } from "@/lib/db/prisma";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

type SaleLine = {
  id: string;
  name?: string;
  quantity: number;
  price?: number;
  batch?: string;
  expiryDate?: string | null;
  daysToExpiry?: number;
  requiresPrescription?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const branchId =
      typeof body.branch_id === "string"
        ? body.branch_id
        : typeof body.branchId === "string"
          ? body.branchId
          : null;

    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required for POS sales" },
        { status: 400 },
      );
    }

    const { pharmacyId: pharmacy_id } = await guardPharmacyFeatureForUser(
      user.id,
      {
        feature: "pos.access",
        branchId,
        consumeTransaction: true,
      },
    );

    const {
      customer,
      items,
      subtotal,
      insuranceCoverage,
      patientAmount,
      paymentMethod,
      cashAmount,
      insuranceAmount,
      prescriptionConfirmation,
      nearExpiryAcknowledged,
      paymentTransactionId,
    } = body as {
      customer?: Record<string, unknown>;
      items?: SaleLine[];
      subtotal?: number | string;
      insuranceCoverage?: number | string;
      patientAmount?: number | string;
      paymentMethod?: string;
      cashAmount?: number | string;
      insuranceAmount?: number | string;
      prescriptionConfirmation?: PrescriptionConfirmation;
      nearExpiryAcknowledged?: boolean;
      paymentTransactionId?: string;
    };

    const saleItems = items ?? [];
    if (saleItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const expiredErr = validateNoExpiredInCart(saleItems);
    if (expiredErr) {
      return NextResponse.json({ error: expiredErr }, { status: 400 });
    }

    if (cartHasNearExpiry(saleItems) && !nearExpiryAcknowledged) {
      return NextResponse.json(
        {
          error:
            "Near-expiry items in cart. Confirm acknowledgement before completing the sale.",
          code: "NEAR_EXPIRY_ACK_REQUIRED",
        },
        { status: 400 },
      );
    }

    const rxErr = validatePrescriptionForSale(
      saleItems,
      prescriptionConfirmation,
    );
    if (rxErr) {
      return NextResponse.json(
        { error: rxErr, code: "PRESCRIPTION_REQUIRED" },
        { status: 400 },
      );
    }

    const usesInsurance =
      (customer?.insuranceType && customer.insuranceType !== "cash") ||
      Number(insuranceCoverage) > 0 ||
      Number(insuranceAmount) > 0;

    if (usesInsurance) {
      try {
        await guardPosInsuranceForUser(user.id);
      } catch (entErr) {
        const res = entitlementRouteResponse(entErr);
        if (res) return res;
        throw entErr;
      }
    }

    const inventoryIds = saleItems.map((i) => i.id);
    const inventoryRows = await storeGetInventoryForSale(inventoryIds);
    const inventoryById = new Map(inventoryRows.map((row) => [row.id, row]));

    const today = new Date().toISOString().slice(0, 10);

    for (const item of saleItems) {
      const inv = inventoryById.get(item.id);
      if (!inv) {
        return NextResponse.json(
          { error: `Product not found: ${item.name ?? item.id}` },
          { status: 400 },
        );
      }

      if (inv.pharmacy_id !== pharmacy_id || inv.branch_id !== branchId) {
        return NextResponse.json(
          {
            error: `${item.name ?? "Item"} is not in stock at the selected branch`,
          },
          { status: 400 },
        );
      }

      const daysToExpiry = computeDaysToExpiry(
        inv.expiry_date?.toISOString().slice(0, 10) ?? null,
      );
      if (isExpired(daysToExpiry)) {
        return NextResponse.json(
          {
            error: `Cannot sell expired batch for ${item.name ?? "item"} (${inv.batch_number})`,
          },
          { status: 400 },
        );
      }

      if (
        inv.medications?.requires_prescription &&
        !prescriptionConfirmation?.confirmed
      ) {
        return NextResponse.json(
          {
            error: `Prescription required for ${item.name ?? "item"}`,
            code: "PRESCRIPTION_REQUIRED",
          },
          { status: 400 },
        );
      }

      const stock = inv.quantity_in_stock ?? 0;
      if (stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.name ?? "item"} (batch ${inv.batch_number})`,
          },
          { status: 400 },
        );
      }

      const expiryIso = inv.expiry_date?.toISOString().slice(0, 10);
      if (expiryIso && expiryIso < today) {
        return NextResponse.json(
          { error: `Batch ${inv.batch_number} is expired` },
          { status: 400 },
        );
      }
    }

    let insuranceProviderId: string | null = null;
    let resolvedInsuranceCoverage = parseFloat(String(insuranceCoverage)) || 0;
    let resolvedPatientAmount =
      parseFloat(String(patientAmount)) || parseFloat(String(subtotal)) || 0;
    let resolvedSubtotal = parseFloat(String(subtotal)) || 0;
    let insuranceCoverageLines: import("@/lib/insurance/types").CoverageLineResult[] =
      [];

    if (customer?.insuranceType && customer.insuranceType !== "cash") {
      const provider = await resolveInsuranceProvider(
        pharmacy_id,
        customer.insuranceType as string,
      );
      insuranceProviderId = provider?.id ?? null;

      const engineLines = saleItems
        .map((item) => {
          const inv = inventoryById.get(item.id);
          const medicationId = inv?.medications?.id ?? inv?.medication_id ?? "";
          return {
            inventoryId: item.id,
            medicationId,
            medicationName: item.name,
            quantity: item.quantity,
            shelfUnitPrice: item.price ?? 0,
          };
        })
        .filter((l) => l.medicationId);

      if (provider && engineLines.length > 0) {
        const totals = await computeInsuranceCoverage({
          pharmacyId: pharmacy_id,
          providerIdOrName: provider.id,
          lines: engineLines,
        });
        if (totals) {
          resolvedSubtotal = totals.subtotal;
          resolvedInsuranceCoverage = totals.insuranceCoverage;
          resolvedPatientAmount = totals.patientCopay;
          insuranceCoverageLines = totals.lines;
        }
      }
    }

    const openShift = await storeFetchOpenCashierShift(user.id, branchId);
    if (!openShift) {
      return NextResponse.json(
        { error: SHIFT_REQUIRED_MESSAGE, code: SHIFT_REQUIRED_CODE },
        { status: 403 },
      );
    }

    const dbPaymentMethod = mapPaymentMethodToDb(paymentMethod ?? "cash");
    const noteParts: string[] = [];
    if (customer?.insuranceNumber) {
      noteParts.push(`Insurance: ${customer.insuranceNumber}`);
    }
    if (prescriptionConfirmation?.confirmed) {
      noteParts.push("Rx confirmed");
      if (prescriptionConfirmation.patientName) {
        noteParts.push(`Patient: ${prescriptionConfirmation.patientName}`);
      }
      if (prescriptionConfirmation.prescriberName) {
        noteParts.push(`Prescriber: ${prescriptionConfirmation.prescriberName}`);
      }
      if (prescriptionConfirmation.notes) {
        noteParts.push(prescriptionConfirmation.notes);
      }
    }
    if (dbPaymentMethod === "mixed") {
      noteParts.push(
        `Split cash: ${cashAmount ?? 0}, insurance/other: ${insuranceAmount ?? 0}`,
      );
    }

    const receiptNumber = `RCP-${Date.now()}`;
    const saleTotal =
      parseFloat(String(patientAmount)) ||
      parseFloat(String(subtotal)) ||
      0;

    let customerId: string | null = null;
    let payerName =
      typeof customer?.name === "string" ? customer.name.trim() : "";
    let payerPhone =
      typeof customer?.phone === "string" ? customer.phone.trim() : null;

    const rawCustomerId = customer?.id;
    if (typeof rawCustomerId === "string" && rawCustomerId.trim()) {
      const registered = await prisma.customers.findFirst({
        where: { id: rawCustomerId.trim(), pharmacy_id: pharmacy_id },
        select: { id: true, name: true, phone: true },
      });
      if (registered) {
        customerId = registered.id;
        payerName = registered.name;
        payerPhone = registered.phone ?? payerPhone;
      }
    }

    const patientName = resolveSalePatientName({ prescriptionConfirmation });
    const payerDisplayName = resolvePayerDisplayName(payerName);

    const { sale, saleItemIdByInventoryId } = await storeCreatePosSale({
      pharmacyId: pharmacy_id,
      branchId,
      cashierId: user.id,
      shiftId: openShift.id,
      customerId,
      customerName: payerDisplayName,
      customerPhone: payerPhone || null,
      patientName,
      insuranceProviderId,
      subtotal: resolvedSubtotal,
      insuranceAmount: resolvedInsuranceCoverage,
      customerAmount: resolvedPatientAmount,
      paymentMethod: dbPaymentMethod,
      receiptNumber,
      notes: noteParts.length > 0 ? noteParts.join(" | ") : null,
      items: saleItems.map((item) => ({
        inventoryId: item.id,
        medicationName: item.name ?? "Unknown",
        quantity: item.quantity,
        unitPrice: item.price ?? 0,
        batchNumber: item.batch,
        expiryDate: item.expiryDate,
      })),
      stockMovements: saleItems.map((item) => ({
        inventoryId: item.id,
        quantity: item.quantity,
      })),
      shiftSaleTotal: Number(openShift.total_sales ?? 0) + saleTotal,
      shiftTransactionCount: Number(openShift.transaction_count ?? 0) + 1,
    });

    if (paymentTransactionId) {
      try {
        await prisma.payment_transactions.update({
          where: { id: paymentTransactionId },
          data: { sale_id: sale.id as string },
        });
      } catch (linkError) {
        console.error("Failed to link payment transaction to sale:", linkError);
      }
    }

    if (insuranceProviderId && resolvedInsuranceCoverage > 0) {
      try {
        const claim = await storeCreateInsuranceClaim({
          pharmacyId: pharmacy_id,
          saleId: String(sale.id),
          providerId: insuranceProviderId,
          patientName: resolveInsuranceClaimPatientName({
            prescriptionConfirmation,
            customerName: payerName,
          }),
          patientIdNumber: (customer?.insuranceNumber as string) || null,
          claimAmount: resolvedInsuranceCoverage,
          coveredAmount: resolvedInsuranceCoverage,
          patientCopay: resolvedPatientAmount,
          metadata: {},
        });

        if (claim?.id && insuranceCoverageLines.length > 0) {
          await insertInsuranceClaimLines({
            claimId: claim.id,
            pharmacyId: pharmacy_id,
            providerId: insuranceProviderId,
            lines: insuranceCoverageLines,
            saleItemIdByInventoryId,
          });
        }
      } catch (claimError) {
        console.error("Insurance claim error:", claimError);
      }
    }

    try {
      await emitNotificationEvent({
        eventType: "sale.completed",
        pharmacyId: pharmacy_id,
        userId: user.id,
        payload: {
          title: "Sale completed",
          message: `Receipt ${receiptNumber} recorded.`,
          type: "success",
          saleId: sale.id,
          receiptNumber,
          total: saleTotal,
          branchId,
        },
      });
    } catch (emitError) {
      console.error("sale.completed notification:", emitError);
    }

    try {
      await awardLoyaltyForSale({
        pharmacyId: pharmacy_id,
        customerId,
        customerPhone: payerPhone,
        customerName: payerDisplayName,
        saleTotal,
      });
    } catch (loyaltyError) {
      console.error("loyalty award:", loyaltyError);
    }

    let ebmSubmission: Awaited<ReturnType<typeof submitPharmacySaleToEbm>> | null =
      null;
    try {
      ebmSubmission = await submitPharmacySaleToEbm({
        pharmacyId: pharmacy_id,
        saleId: String(sale.id),
        receiptNumber,
        customerName: (customer?.name as string) || null,
        paymentMethod: paymentMethod ?? "cash",
        subtotal: saleTotal,
        items: saleItems.map((item) => ({
          name: item.name ?? "Unknown",
          quantity: item.quantity,
          unitPrice: item.price ?? 0,
        })),
      });
    } catch (ebmError) {
      console.error("ebm submission:", ebmError);
    }

    try {
      await dispatchIntegrationWebhookEvent({
        eventType: "sale.completed",
        payload: {
          pharmacyId: pharmacy_id,
          branchId,
          saleId: sale.id,
          receiptNumber,
          totalAmount: saleTotal,
          paymentMethod: paymentMethod ?? "cash",
          customerName: (customer?.name as string) || null,
          ebmNumber: ebmSubmission?.ebmNumber ?? null,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (webhookError) {
      console.error("sale.completed webhook:", webhookError);
    }

    await writeAuditLog({
      pharmacyId: pharmacy_id,
      userId: user.id,
      action: "INSERT",
      tableName: "sales",
      recordId: String(sale.id),
      newValues: {
        saleId: sale.id,
        receiptNumber,
        branchId,
        total: saleTotal,
        paymentMethod: dbPaymentMethod,
        itemCount: saleItems.length,
        ebm: ebmSubmission
          ? {
              ok: ebmSubmission.ok,
              mode: ebmSubmission.mode,
              ebmNumber: ebmSubmission.ebmNumber ?? null,
            }
          : null,
      },
      ...auditRequestMetadata(request),
    });

    void invalidateSalesCache(pharmacy_id);

    return NextResponse.json({
      success: true,
      sale,
      receiptNumber,
      ebm: ebmSubmission,
      message: "Sale processed successfully",
    });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("Sale processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process sale",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function invalidateSalesCache(pharmacyId: string) {
  await Promise.all([
    cacheDelByPrefix(`dashboard:${pharmacyId}`),
    cacheDelByPrefix(`sales:${pharmacyId}`),
    cacheDelByPrefix(`inventory:${pharmacyId}`),
    cacheDelByPrefix(`reports:${pharmacyId}`),
  ]);
}
