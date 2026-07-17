import type { MeContextResponse } from "@/lib/http/me-context";
import type { CombinedDashboardData } from "@/lib/http/pharmacy-dashboard";
import type { PharmacyEntitlementsSnapshot } from "@/lib/subscription/lifecycle/types";
import type {
  PharmacySubscriptionSummary,
  SubscriptionPlan,
} from "@/lib/saas/types";
import type { StaffUser } from "@/lib/http/staff";

export type SessionBootstrapPayload = {
  ok: true;
  path: string;
  mustChangePassword: boolean;
  me: MeContextResponse;
  entitlements: PharmacyEntitlementsSnapshot | null;
  dashboard: CombinedDashboardData | null;
  subscription: PharmacySubscriptionSummary | null;
  plans: SubscriptionPlan[] | null;
  staff: StaffUser[] | null;
};
