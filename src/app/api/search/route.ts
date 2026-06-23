import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  escapeIlikePattern,
  MIN_GLOBAL_SEARCH_LENGTH,
} from "@/lib/search/escape-ilike";
import type { PharmacyGlobalSearchResult } from "@/lib/search/types";
import { searchPharmacyGlobal } from "@/lib/db/pharmacy-search";

const EMPTY: PharmacyGlobalSearchResult = {
  customers: [],
  products: [],
  prescriptions: [],
  sales: [],
  staff: [],
  branches: [],
};

export async function GET(request: NextRequest) {
  try {
    const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (raw.length < MIN_GLOBAL_SEARCH_LENGTH) {
      return NextResponse.json(EMPTY);
    }

    const pattern = escapeIlikePattern(raw);
    if (pattern.length < MIN_GLOBAL_SEARCH_LENGTH) {
      return NextResponse.json(EMPTY);
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(EMPTY);
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const result = await searchPharmacyGlobal(pharmacyId, pattern);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/search", error);
    return NextResponse.json(EMPTY);
  }
}
