import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { createBranch } from "@/lib/saas/subscription-engine";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "@/lib/subscription/assert-entitlement";
import { getRequestPharmacyId } from "@/lib/subscription/api-guard";
import { assertPlatformMultiBranchEnabled } from "@/lib/platform-policy/enforce";
import { platformPolicyErrorResponse } from "@/lib/platform-policy/errors";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await getRequestPharmacyId(user.id);
    if (!pharmacyId) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const branches = await prisma.branches.findMany({
      where: { pharmacy_id: pharmacyId, is_active: true },
      orderBy: { created_at: "desc" },
    });

    const formattedBranches = branches.map((b) => ({
      id: b.id,
      name: b.name,
      location: b.address,
      manager: b.manager_id,
      phone: b.phone,
      email: b.phone,
      status: b.is_active ? "active" : "inactive",
      staff_count: 0,
      monthly_sales: 0,
      created_at: b.created_at?.toISOString() ?? null,
    }));

    return NextResponse.json(formattedBranches);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await getRequestPharmacyId(user.id);
    if (!pharmacyId) {
      return NextResponse.json({ success: false, error: "Pharmacy not found" }, { status: 403 });
    }

    await assertPlatformMultiBranchEnabled();

    await requirePharmacyEntitlement({
      pharmacyId,
      feature: "branches.create",
      limit: "branches",
    });

    const body = await request.json();
    const branch = await createBranch(pharmacyId, {
      name: body.name,
      address: body.location ?? body.address,
      phone: body.phone,
      email: body.email,
    });

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    const policy = platformPolicyErrorResponse(error);
    if (policy) {
      return NextResponse.json(policy.body, { status: policy.status });
    }
    const mapped = entitlementErrorResponse(error);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create branch" },
      { status: 500 },
    );
  }
}
