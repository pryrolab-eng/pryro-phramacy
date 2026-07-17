"use client";

import { Badge, badgeVariantFromTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  subscriptionStatusTone,
  type StatusTone,
} from "@/lib/ui/status-tone";

export function BillingStatusBadge({
  status,
  className,
  tone: toneOverride,
}: {
  status: string;
  className?: string;
  tone?: StatusTone;
}) {
  const tone = toneOverride ?? subscriptionStatusTone(status);
  return (
    <Badge
      variant={badgeVariantFromTone(tone)}
      className={cn("h-5 capitalize", className)}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
