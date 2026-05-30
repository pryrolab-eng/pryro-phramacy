"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OnboardingStepper,
  type OnboardingStepId,
} from "./onboarding-stepper";

type Props = {
  step: OnboardingStepId;
  children: React.ReactNode;
  onSkip?: () => void;
  skipLabel?: string;
  showSkip?: boolean;
  className?: string;
};

export function OnboardingShell({
  step,
  children,
  onSkip,
  skipLabel = "Skip for now",
  showSkip = false,
  className,
}: Props) {
  return (
    <div className={cn("min-h-screen bg-neutral-50", className)}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 space-y-4">
          <div className="flex justify-end">
            {showSkip && onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="text-sm text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
              >
                {skipLabel}
              </button>
            ) : (
              <Link
                href="/app"
                className="text-sm text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
              >
                Save &amp; exit
              </Link>
            )}
          </div>
          <OnboardingStepper current={step} />
        </div>
        {children}
      </main>
    </div>
  );
}

type StepNavProps = {
  onBack?: () => void;
  backLabel?: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryType?: "button" | "submit";
};

export function OnboardingStepNav({
  onBack,
  backLabel = "Back",
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  primaryType = "button",
}: StepNavProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      <button
        type={primaryType}
        onClick={primaryType === "button" ? onPrimary : undefined}
        disabled={primaryDisabled || primaryLoading}
        className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {primaryLoading ? "Please wait…" : primaryLabel}
        {!primaryLoading ? <span aria-hidden>→</span> : null}
      </button>
    </div>
  );
}
