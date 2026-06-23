import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { storeSearchPharmacies } from "@/lib/db/admin-store";
import { prisma } from "@/lib/db/prisma";
import {
  escapeIlikePattern,
  MIN_GLOBAL_SEARCH_LENGTH,
} from "@/lib/search/escape-ilike";
import type { AdminGlobalSearchResult } from "@/lib/search/types";

const EMPTY: AdminGlobalSearchResult = { pharmacies: [], staff: [], branches: [] };

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (raw.length < MIN_GLOBAL_SEARCH_LENGTH) {
    return NextResponse.json(EMPTY);
  }

  const pattern = escapeIlikePattern(raw);
  if (pattern.length < MIN_GLOBAL_SEARCH_LENGTH) {
    return NextResponse.json(EMPTY);
  }

  try {
    const [pharmaciesData, staffMatches, branchMatches] = await Promise.all([
      storeSearchPharmacies(pattern),
      prisma.staff.findMany({
        where: {
          OR: [
            { first_name: { contains: raw, mode: "insensitive" } },
            { last_name: { contains: raw, mode: "insensitive" } },
            { email: { contains: raw, mode: "insensitive" } },
          ],
        },
        include: {
          pharmacies: {
            select: {
              name: true,
            },
          },
        },
        take: 20,
      }),
      prisma.branches.findMany({
        where: {
          OR: [
            { name: { contains: raw, mode: "insensitive" } },
            { address: { contains: raw, mode: "insensitive" } },
          ],
        },
        include: {
          pharmacies: {
            select: {
              name: true,
            },
          },
        },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      pharmacies: pharmaciesData.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
      })),
      staff: staffMatches.map((s) => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        role: s.position,
        pharmacyId: s.pharmacy_id ?? "",
        pharmacyName: s.pharmacies?.name ?? "Unknown Pharmacy",
      })),
      branches: branchMatches.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.address,
        status: b.is_active ? "Active" : "Inactive",
        pharmacyId: b.pharmacy_id ?? "",
        pharmacyName: b.pharmacies?.name ?? "Unknown Pharmacy",
      })),
    } satisfies AdminGlobalSearchResult);
  } catch (error) {
    console.error("GET /api/admin/search", error);
    return NextResponse.json(EMPTY);
  }
}

