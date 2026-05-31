import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  escapeIlikePattern,
  MIN_GLOBAL_SEARCH_LENGTH,
} from "@/lib/search/escape-ilike";
import type { AdminGlobalSearchResult } from "@/lib/search/types";

const EMPTY: AdminGlobalSearchResult = { pharmacies: [] };

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
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
    const supabase = getServiceClient();
    const like = `%${pattern}%`;

    const { data, error } = await supabase
      .from("pharmacies")
      .select("id, name, email, phone")
      .or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("Admin global search:", error);
      return NextResponse.json(EMPTY);
    }

    return NextResponse.json({
      pharmacies: (data ?? []).map((p) => ({
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
