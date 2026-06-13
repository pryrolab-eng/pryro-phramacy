import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { storeSearchPharmacies } from "@/lib/db/admin-store";
import {
  escapeIlikePattern,
  MIN_GLOBAL_SEARCH_LENGTH,
} from "@/lib/search/escape-ilike";
import type { AdminGlobalSearchResult } from "@/lib/search/types";

const EMPTY: AdminGlobalSearchResult = { pharmacies: [] };

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
    const data = await storeSearchPharmacies(pattern);
    return NextResponse.json({
      pharmacies: data.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
      })),
    } satisfies AdminGlobalSearchResult);
  } catch (error) {
    console.error("GET /api/admin/search", error);
    return NextResponse.json(EMPTY);
  }
}
