"use client";

import { cn } from "@/lib/utils";
import { subscriptionStatusClass } from "@/lib/billing/format-billing";

export function BillingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        subscriptionStatusClass(status),
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
