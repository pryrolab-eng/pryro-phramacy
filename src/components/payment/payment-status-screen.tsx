"use client";

import { Check, Loader2, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaymentStatusVariant = "checking" | "success" | "failed";

type PaymentStatusScreenProps = {
  status: PaymentStatusVariant;
  title: string;
  message: string;
  children?: React.ReactNode;
  className?: string;
};

function StatusIcon({ status }: { status: PaymentStatusVariant }) {
  if (status === "checking") {
    return (
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center"
        aria-hidden
      >
        <Loader2 className="h-10 w-10 animate-spin text-neutral-900" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-neutral-900"
        aria-hidden
      >
        <Check className="h-8 w-8 text-neutral-900" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div
      className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-50"
      aria-hidden
    >
      <X className="h-8 w-8 text-neutral-600" strokeWidth={2} />
    </div>
  );
}

export function PaymentStatusScreen({
  status,
  title,
  message,
  children,
  className,
}: PaymentStatusScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-neutral-50 p-6",
        className,
      )}
    >
      <div
        className="w-full max-w-md rounded-xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <StatusIcon status={status} />
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">{message}</p>
        {children ? (
          <div className="mt-8 space-y-3">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

export function PaymentStatusPrimaryButton({
  children,
  onClick,
  className,
  asChild,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      type={asChild ? undefined : "button"}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-md bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function PaymentStatusSecondaryButton({
  children,
  onClick,
  className,
  asChild,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      type={asChild ? undefined : "button"}
      variant={asChild ? undefined : "outline"}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-900 hover:bg-neutral-50",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
