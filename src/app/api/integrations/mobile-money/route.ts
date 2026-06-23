import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { findPlatformIntegrationCredential } from "@/lib/integrations/platform-credentials";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireSessionPharmacyId(user.id);

    const apiKey = await findPlatformIntegrationCredential("Mobile Money API");

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Mobile Money API credential not configured. Add a platform key named \"Mobile Money API\" in Admin → Settings → Integrations.",
        },
        { status: 400 },
      );
    }

    const { amount, phone, provider } = await request.json();
    if (!amount || !phone || !provider) {
      return NextResponse.json(
        { error: "amount, phone, and provider are required" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: `momo_tx_${Math.random().toString(36).substring(2, 15)}`,
      status: "completed",
      provider,
      phone,
      amount,
      reference: `ref-${Math.random().toString(36).substring(2, 11)}`,
      message: "Mobile money payment collected successfully via simulated provider adapter.",
    });
  } catch (error) {
    console.error("POST /api/integrations/mobile-money", error);
    return NextResponse.json({ error: "Mobile money payment failed" }, { status: 500 });
  }
}
