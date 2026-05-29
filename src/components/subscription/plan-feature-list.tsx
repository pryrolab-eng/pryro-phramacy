"use client";

import { Check } from "lucide-react";
import { summarizePlanFeatures } from "@/lib/subscription/plan-marketing-features";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type Props = {
  features: string[];
  maxVisible?: number;
  className?: string;
  dense?: boolean;
};

export function PlanFeatureList({
  features,
  maxVisible = 6,
  className,
  dense,
}: Props) {
  const { visible, moreCount, all } = summarizePlanFeatures(features, maxVisible);
  const hidden = all.slice(visible.length);

  if (all.length === 0) return null;

  const itemClass = cn(
    "flex items-start gap-2 text-muted-foreground",
    dense ? "text-xs" : "text-sm",
  );

  const checkClass = cn(
    "shrink-0 text-primary mt-0.5",
    dense ? "size-3" : "size-4",
  );

  return (
    <div className={className}>
      <ul className={cn("space-y-2", dense && "space-y-1.5")}>
        {visible.map((label) => (
          <li key={label} className={itemClass}>
            <Check className={checkClass} strokeWidth={2.5} />
            <span className="leading-snug">{label}</span>
          </li>
        ))}
      </ul>
      {moreCount > 0 ? (
        <HoverCard openDelay={120} closeDelay={80}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors",
                "hover:border-primary/30 hover:bg-muted hover:text-foreground",
              )}
            >
              +{moreCount} more feature{moreCount === 1 ? "" : "s"}
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            side="top"
            align="center"
            className="w-56 p-3"
          >
            <p className="mb-2 text-xs font-semibold text-gray-900 dark:text-white">
              Also included
            </p>
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {hidden.map((label) => (
                <li key={label} className={itemClass}>
                  <Check className={checkClass} strokeWidth={2.5} />
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>
          </HoverCardContent>
        </HoverCard>
      ) : null}
    </div>
  );
}
