import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { storeListAdminTransactions } from "@/lib/db/admin-store";

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { transactions, subscriptions } = await storeListAdminTransactions();
    return NextResponse.json({ transactions, subscriptions });
  } catch (error) {
    console.error("GET /api/admin/transactions", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
