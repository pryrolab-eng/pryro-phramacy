import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  guardPharmacyFeatureForUser,
  handleEntitlementRouteError,
} from "@/lib/subscription/api-guard";
import { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";
import { storeFindMembershipAtPharmacy } from "@/lib/db/pharmacy-users-store";
import {
  serializeCashierShift,
  storeCloseCashierShift,
  storeFindCashierDisplayNames,
  storeGetOpenShiftForUser,
  storeListOpenTeamShifts,
  storeOpenCashierShift,
  storeSummarizeShiftSales,
} from "@/lib/db/cashier-shifts-store";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

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

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
      branchId,
    });

    const teamView = new URL(request.url).searchParams.get("team") === "open";

    if (teamView) {
      const membership = await storeFindMembershipAtPharmacy(user.id, pharmacyId);
      if (!membership || !isPharmacyOwnerRole(membership.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const openShifts = await storeListOpenTeamShifts({
        pharmacyId,
        branchId,
      });

      const cashierIds = Array.from(
        new Set(openShifts.map((s) => s.cashier_id)),
      );
      const nameById = await storeFindCashierDisplayNames(cashierIds);

      const team = await Promise.all(
        openShifts.map(async (row) => {
          const summary = await storeSummarizeShiftSales({
            pharmacyId,
            branchId,
            cashierId: row.cashier_id,
            openedAt: row.opened_at,
          });
          return {
            id: row.id,
            cashierId: row.cashier_id,
            cashierName: nameById.get(row.cashier_id) ?? "Staff",
            openedAt: row.opened_at,
            openingCash: row.opening_cash,
            isCurrentUser: row.cashier_id === user.id,
            liveTotalSales: summary.totalSales,
            liveTransactionCount: summary.transactionCount,
          };
        }),
      );

      return NextResponse.json({ team });
    }

    const shift = await storeGetOpenShiftForUser({
      pharmacyId,
      branchId,
      cashierId: user.id,
    });

    if (!shift) {
      return NextResponse.json({ shift: null });
    }

    const summary = await storeSummarizeShiftSales({
      pharmacyId,
      branchId,
      cashierId: user.id,
      openedAt: shift.opened_at.toISOString(),
    });

    return NextResponse.json({
      shift: {
        ...serializeCashierShift(shift),
        liveTotalSales: summary.totalSales,
        liveCashSales: summary.cashSales,
        liveTransactionCount: summary.transactionCount,
        expectedCash: shift.opening_cash + summary.cashSales,
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
    const user = await getAuthUser();

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

    const { pharmacyId } = await guardPharmacyFeatureForUser(user.id, {
      feature: "pos.access",
      branchId,
    });

    if (action === "open") {
      const openingCash = Number(body.openingCash) || 0;

      try {
        const shift = await storeOpenCashierShift({
          pharmacyId,
          branchId,
          cashierId: user.id,
          openingCash,
        });
        return NextResponse.json({
          success: true,
          shift: serializeCashierShift(shift),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to open shift";
        if (message.includes("already have an open shift")) {
          return NextResponse.json({ error: message }, { status: 400 });
        }
        throw error;
      }
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

      const { shift, summary } = await storeCloseCashierShift({
        shiftId,
        cashierId: user.id,
        pharmacyId,
        branchId,
        actualCash,
        closeNotes,
      });

      return NextResponse.json({
        success: true,
        shift: serializeCashierShift(shift),
        summary,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const entitlement = handleEntitlementRouteError(error);
    if (entitlement) return entitlement;
    console.error("POST /api/pos/shifts", error);
    const message =
      error instanceof Error ? error.message : "Shift action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
