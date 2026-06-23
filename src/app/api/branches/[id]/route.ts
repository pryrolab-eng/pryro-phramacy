import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { storeListInventory } from "@/lib/db/inventory-store";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import { getStaffAllowedBranchIds } from "@/lib/pharmacy/staff-branch-access";
import { PHARMACY_PERMISSIONS } from "@/lib/rbac/permissions";
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from "@/lib/rbac/require-pharmacy-permission";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ctx } = await requirePharmacyPermission(
      user.id,
      PHARMACY_PERMISSIONS.branchesManage,
    );
    const pharmacyId = ctx.activePharmacyId;

    const existing = await prisma.branches.findFirst({
      where: { id, pharmacy_id: pharmacyId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const branch = await prisma.branches.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name) } : {}),
        ...(body.address !== undefined || body.location !== undefined
          ? { address: body.address ?? body.location ?? null }
          : {}),
        ...(body.phone !== undefined ? { phone: body.phone ?? null } : {}),
        ...(body.email !== undefined ? { email: body.email ?? null } : {}),
        ...(body.is_active !== undefined
          ? { is_active: Boolean(body.is_active) }
          : body.status !== undefined
            ? { is_active: body.status === "active" }
            : {}),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        is_active: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    const permission = permissionErrorResponse(error);
    if (permission) {
      return NextResponse.json(permission.body, { status: permission.status });
    }
    console.error("PUT /api/branches/[id]", error);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: branchId } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await resolveActivePharmacyContext(user.id);
    const pharmacyId = ctx.activePharmacyId;
    if (!pharmacyId) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    const allowedBranchIds = await getStaffAllowedBranchIds(
      user.id,
      pharmacyId,
      ctx.role,
    );
    if (allowedBranchIds !== null && !allowedBranchIds.includes(branchId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const branch = await prisma.branches.findFirst({
      where: { id: branchId, pharmacy_id: pharmacyId, is_active: true },
      select: { id: true },
    });
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const inventory = await storeListInventory(pharmacyId, branchId);
    const formatted = inventory.map((item) => ({
      id: item.id,
      name: item.name,
      stock: item.stock ?? 0,
      price: item.price ?? 0,
      category: item.category,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/branches/[id]", error);
    return NextResponse.json(
      { error: "Failed to fetch branch inventory" },
      { status: 500 },
    );
  }
}
