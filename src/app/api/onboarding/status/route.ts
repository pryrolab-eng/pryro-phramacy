import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveOnboardingStatus } from "@/lib/onboarding/resolve-onboarding-status";

export type { OnboardingStep } from "@/lib/onboarding/resolve-onboarding-status";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await resolveOnboardingStatus(user.id);
  return NextResponse.json(status);
}
