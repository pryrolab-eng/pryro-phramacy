import type { SubscriptionLifecycleStatus } from "@/lib/subscription/lifecycle/types";

/** Why dashboard access is blocked (when not `none`). */
export type PharmacyAccessBlockReason =
  | "none"
  | "pharmacy_suspended"
  | "pharmacy_inactive"
  | "pending_payment"
  | "subscription_expired"
  | "subscription_cancelled"
  | "past_due"
  | "no_subscription";

export type AccessBlockMessaging = {
  shortLabel: string;
  title: string;
  description: string;
  staffNote?: string;
  showBilling: boolean;
  billingCta: string;
  badgeVariant: "amber" | "destructive" | "muted";
};

export function resolveAccessBlockReason(input: {
  pharmacyStatus: string | null | undefined;
  hasMainSubscription: boolean;
  lifecycleStatus: SubscriptionLifecycleStatus | null;
  isExpired: boolean;
  subscriptionAccessAllowed: boolean;
}): PharmacyAccessBlockReason {
  const pharmacyStatus = (input.pharmacyStatus ?? "active").toLowerCase();

  if (pharmacyStatus === "inactive") {
    return "pharmacy_inactive";
  }

  if (pharmacyStatus === "suspended") {
    return "pharmacy_suspended";
  }

  if (!input.hasMainSubscription) {
    return "no_subscription";
  }

  const lifecycle = input.lifecycleStatus;

  if (lifecycle === "pending_payment") {
    return "pending_payment";
  }

  if (lifecycle === "cancelled") {
    return "subscription_cancelled";
  }

  if (lifecycle === "past_due") {
    return "past_due";
  }

  if (
    input.isExpired ||
    lifecycle === "expired" ||
    !input.subscriptionAccessAllowed
  ) {
    return "subscription_expired";
  }

  return "none";
}

/** Billing is only useful when payment or plan renewal can restore access. */
export function canAccessBillingWhenBlocked(
  reason: PharmacyAccessBlockReason,
): boolean {
  return (
    reason === "pending_payment" ||
    reason === "subscription_expired" ||
    reason === "no_subscription" ||
    reason === "past_due" ||
    reason === "subscription_cancelled"
  );
}


export function getAccessBlockMessaging(
  reason: PharmacyAccessBlockReason,
  isOwner: boolean,
): AccessBlockMessaging {
  switch (reason) {
    case "pharmacy_suspended":
      return {
        shortLabel: "Pharmacy suspended",
        title: "This pharmacy is suspended",
        description: isOwner
          ? "Operations are paused by Pryrox or your administrator. Renewing a plan alone may not restore access — contact support or ask your platform admin to reactivate the store."
          : "This location is suspended. You cannot use the dashboard or complete billing here. Contact the pharmacy owner or Pryrox support.",
        staffNote:
          "Do not try to pay unless the owner explicitly asked you and support confirmed the store can be reactivated.",
        showBilling: false,
        billingCta: "Contact support",
        badgeVariant: "destructive",
      };
    case "pharmacy_inactive":
      return {
        shortLabel: "Pharmacy inactive",
        title: "This pharmacy is inactive",
        description: isOwner
          ? "The store record is marked inactive. Contact support if you believe this is a mistake."
          : "This pharmacy is inactive. Contact the owner or platform support.",
        showBilling: false,
        billingCta: "Contact support",
        badgeVariant: "destructive",
      };
    case "pending_payment":
      return {
        shortLabel: "Payment required",
        title: "Complete payment to activate",
        description: isOwner
          ? "Your plan is selected but payment is not finished. Open billing to pay by card or mobile money."
          : "Payment is still pending. Tell the owner, or open billing only if they asked you to pay.",
        showBilling: true,
        billingCta: isOwner ? "View plans & billing" : "Open billing to pay",
        badgeVariant: "amber",
      };
    case "subscription_expired":
      return {
        shortLabel: "Subscription expired",
        title: "Subscription expired",
        description: isOwner
          ? "Renew or change your plan in billing to unlock POS, inventory, and reports."
          : "The plan has expired. Notify the owner, or open billing if they delegated payment to you.",
        showBilling: true,
        billingCta: isOwner ? "Renew in billing" : "Open billing to renew",
        badgeVariant: "amber",
      };
    case "subscription_cancelled":
      return {
        shortLabel: "Subscription cancelled",
        title: "Subscription cancelled",
        description: isOwner
          ? "Choose a new plan in billing to start again."
          : "The subscription was cancelled. Contact the owner or use billing if they asked you to resubscribe.",
        showBilling: true,
        billingCta: isOwner ? "Choose a plan" : "Open billing",
        badgeVariant: "amber",
      };
    case "past_due":
      return {
        shortLabel: "Payment overdue",
        title: "Payment overdue",
        description: isOwner
          ? "Update payment in billing to avoid losing access."
          : "Payment is overdue. Tell the owner or open billing if they asked you to fix it.",
        showBilling: true,
        billingCta: isOwner ? "Update billing" : "Open billing",
        badgeVariant: "amber",
      };
    case "no_subscription":
      return {
        shortLabel: "No active plan",
        title: "No active subscription",
        description: isOwner
          ? "Pick a plan in billing to start using Pryrox."
          : "No plan is active yet. Tell the owner to subscribe, or open billing if they asked you to set it up.",
        showBilling: true,
        billingCta: isOwner ? "Choose a plan" : "Open billing",
        badgeVariant: "amber",
      };
    default:
      return {
        shortLabel: "Active",
        title: "",
        description: "",
        showBilling: false,
        billingCta: "",
        badgeVariant: "muted",
      };
  }
}

export function getWithinLimitBlockReason(
  reason: PharmacyAccessBlockReason,
): string {
  if (reason === "none") return "Subscription inactive";
  return getAccessBlockMessaging(reason, false).shortLabel;
}
