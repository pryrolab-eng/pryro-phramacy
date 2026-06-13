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

    // TODO: Replace with actual mobile money API call using apiKey.key_hash
    const payment = {
      transactionId: `MM${Date.now()}`,
      amount,
      phone,
      provider,
      status: "success",
      reference: `REF${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, payment });
  } catch {
    return NextResponse.json({ error: "Mobile money payment failed" }, { status: 500 });
  }
}
