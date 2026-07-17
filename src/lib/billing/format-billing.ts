import type { BadgeProps } from "@/components/ui/badge";
import { badgeVariantFromTone } from "@/components/ui/badge";
import {
  invoiceStatusTone,
  subscriptionStatusTone,
  statusToneBadgeClass,
} from "@/lib/ui/status-tone";

/** @deprecated Prefer StatusBadge / Badge with invoiceStatusTone */
export function invoiceStatusVariant(
  status: string,
): NonNullable<BadgeProps["variant"]> {
  return badgeVariantFromTone(invoiceStatusTone(status));
}

/** @deprecated Prefer subscriptionStatusTone + statusToneBadgeClass */
export function subscriptionStatusClass(status: string) {
  return statusToneBadgeClass[subscriptionStatusTone(status)];
}
