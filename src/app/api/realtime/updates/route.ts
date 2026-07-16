import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { requireSessionPharmacyId, resolveUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { cacheGet, cacheSet } from "@/lib/cache/redis-cache";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

const CACHE_TTL_S = 10;

let lastUpdateTime = new Date();

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json([]);
    }

    // Platform admins don't have a pharmacy — skip realtime updates
    const isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);
    if (isPlatformAdmin) {
      return NextResponse.json([]);
    }

    const pharmacyId = await resolveUserPharmacyId(user.id);
    if (!pharmacyId) {
      return NextResponse.json([]);
    }

    // Fast path: Redis cache hit avoids 5-11s DB query
    const cacheKey = `realtime:updates:${pharmacyId}`;
    const cached = await cacheGet<{ updates: unknown[]; ts: string }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached.updates);
    }

    const since = lastUpdateTime;
    const updates: Array<{ type: string; data: unknown }> = [];

    const [inventoryUpdates, newSales] = await Promise.all([
      prisma.inventory.findMany({
        where: {
          pharmacy_id: pharmacyId,
          updated_at: { gte: since },
        },
        select: { id: true, quantity_in_stock: true, updated_at: true },
      }),
      prisma.sales.findMany({
        where: {
          pharmacy_id: pharmacyId,
          created_at: { gte: since },
        },
        select: { id: true, total_amount: true, created_at: true },
      }),
    ]);

    if (inventoryUpdates.length) {
      updates.push({
        type: "inventory_update",
        data: inventoryUpdates.map((row) => ({
          id: row.id,
          quantity_in_stock: row.quantity_in_stock,
          updated_at: row.updated_at?.toISOString() ?? null,
        })),
      });
    }

    if (newSales.length) {
      updates.push({
        type: "new_sale",
        data: newSales.map((row) => ({
          id: row.id,
          total_amount: row.total_amount,
          created_at: row.created_at?.toISOString() ?? null,
        })),
      });
    }

    lastUpdateTime = new Date();

    // Short TTL so the next poll doesn't hammer the DB
    cacheSet(cacheKey, { updates, ts: new Date().toISOString() }, CACHE_TTL_S);

    return NextResponse.json(updates);
  } catch (error) {
    return NextResponse.json([]);
  }
}
