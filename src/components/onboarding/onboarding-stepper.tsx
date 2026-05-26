"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingStepId = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = [
  "Profile",
  "Plan",
  "Payment",
  "Live",
  "Team",
] as const;

type Props = {
  current: OnboardingStepId;
  className?: string;
};

export function OnboardingStepper({ current, className }: Props) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-1">
        {STEP_LABELS.map((label, index) => {
          const stepNum = (index + 1) as OnboardingStepId;
          const done = stepNum < current;
          const active = stepNum === current;

          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      done || active ? "bg-neutral-900" : "bg-neutral-200",
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    done && "border-neutral-900 bg-neutral-900 text-white",
                    active &&
                      !done &&
                      "border-neutral-900 bg-white text-neutral-900",
                    !done &&
                      !active &&
                      "border-neutral-200 bg-white text-neutral-400",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : stepNum}
                </div>
                {index < STEP_LABELS.length - 1 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      done ? "bg-neutral-900" : "bg-neutral-200",
                    )}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-medium uppercase tracking-wider sm:block",
                  active ? "text-neutral-900" : "text-neutral-400",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
