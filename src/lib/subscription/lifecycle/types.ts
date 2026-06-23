import type { PharmacyAccessBlockReason } from "@/lib/subscription/access-block";

/** Canonical subscription lifecycle status (authoritative). */
export type SubscriptionLifecycleStatus =
  | "pending_payment"
  | "active"
  | "scheduled_change"
  | "cancelled"
  | "expired"
  | "past_due";

export type ScheduledChangeStatus = "scheduled" | "applied" | "canceled";

export type CatalogPlanInput = {
  id: string;
  name: string;
  price: number | string | null;
  period?: string | null;
  billing_period?: string | null;
};

export type PaymentActivationMeta = {
  paymentMethod?: string;
  paymentReference?: string | null;
  planName?: string;
};

export type EntitlementPlan = {
  id: string;
  name: string;
  price: number;
  period?: string | null;
  max_users?: number;
  max_branches?: number;
  monthly_tx_limit?: number;
};

export type EntitlementLimits = {
  maxUsers: number;
  maxBranches: number;
  monthlyTxPerBranch: number;
  /** main plan slots + branch add-ons */
  totalBranchSlots: number;
};

export type EntitlementUsage = {
  activeUsers: number;
  activeBranches: number;
};

export type WithinLimitResult = {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
};

export type ScheduledChangeInfo = {
  status: "scheduled";
  effectiveAt: string;
  changeType: "downgrade";
  targetPlan: EntitlementPlan;
  currentPlan: EntitlementPlan | null;
  subscriptionId: string;
};

export type PharmacyEntitlements = {
  pharmacyId: string;
  pharmacyStatus: string;
  effectivePlan: EntitlementPlan | null;
  effectivePlanLabel: string;
  subscriptionId: string | null;
  lifecycleStatus: SubscriptionLifecycleStatus | null;
  expiresAt: string | null;
  isAccessAllowed: boolean;
  accessBlockReason: PharmacyAccessBlockReason;
  isExpired: boolean;
  daysRemaining: number | null;
  scheduledChange: ScheduledChangeInfo | null;
  featureKeys: string[];
  limits: EntitlementLimits;
  usage: EntitlementUsage;
  can: (featureKey: string) => boolean;
  withinLimit: (limitKey: "users" | "branches" | "transactions") => WithinLimitResult;
};

/** JSON-safe shape for client hooks */
export type PharmacyEntitlementsSnapshot = {
  pharmacyId: string;
  pharmacyStatus: string;
  effectivePlan: EntitlementPlan | null;
  effectivePlanLabel: string;
  isAccessAllowed: boolean;
  accessBlockReason: PharmacyAccessBlockReason;
  isExpired: boolean;
  daysRemaining: number | null;
  featureKeys: string[];
  limits: EntitlementLimits;
  usage: EntitlementUsage;
  routeFeatureMap: Record<string, string>;
  featureLabels: Record<string, string>;
};
