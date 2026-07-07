"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, ShieldCheck, X, ArrowLeft } from "lucide-react";
import { AuthBrandingLogo } from "@/components/auth-branding";
import { getPolarCheckoutStatus } from "@/lib/http/polar";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { cn } from "@/lib/utils";

type UiStatus = "checking" | "success" | "failed";

function usePaymentVerification(checkoutId: string | null) {
  return useQuery({
    queryKey: ["payment-success-status", checkoutId],
    queryFn: async () => {
      const data = await getPolarCheckoutStatus(checkoutId!);
      return data;
    },
    enabled: !!checkoutId,
    retry: false,
  });
}

function StatusIcon({ status }: { status: UiStatus }) {
  if (status === "checking") {
    return (
      <div className="relative mx-auto mb-6 flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/20" aria-hidden />
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-sky-100 ring-4 ring-sky-200/80 dark:bg-sky-950 dark:ring-sky-800/60">
          <Loader2 className="size-8 animate-spin text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="relative mx-auto mb-6 flex size-16 items-center justify-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-emerald-100 ring-4 ring-emerald-200/80 dark:bg-emerald-950 dark:ring-emerald-800/60">
          <Check className="size-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto mb-6 flex size-16 items-center justify-center">
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-red-100 ring-4 ring-red-200/80 dark:bg-red-950 dark:ring-red-800/60">
        <X className="size-8 text-red-600 dark:text-red-400" strokeWidth={2} />
      </div>
    </div>
  );
}

export function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");

  const verification = usePaymentVerification(checkoutId);

  const uiStatus: UiStatus =
    verification.isPending
      ? "checking"
      : verification.data?.status === "completed"
        ? "success"
        : verification.isError || verification.data?.status === "failed"
          ? "failed"
          : "checking";

  const title =
    uiStatus === "checking"
      ? "Processing payment"
      : uiStatus === "success"
        ? "Payment successful"
        : "Payment failed";

  const message = verification.isPending
    ? "Verifying your payment..."
    : verification.isError
      ? "Unable to verify payment status."
      : verification.data?.status === "completed"
        ? "Your subscription is active. You can continue setup."
        : verification.data?.status === "failed"
          ? "Payment failed. Please try again."
          : "Payment is still processing. Check Settings in a few minutes.";

  const goNext = () => {
    const returnParam = searchParams.get("return");
    const fromOb =
      typeof window !== "undefined" &&
      (sessionStorage.getItem("pryrox_payment_return") === "onboarding" ||
        returnParam === "onboarding");
    const fromBilling =
      typeof window !== "undefined" &&
      (sessionStorage.getItem("pryrox_payment_return") === "billing" ||
        returnParam === "billing");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("pryrox_payment_return");
    }
    if (fromOb) {
      sessionStorage.setItem("pryrox_onboarding_step", "4");
      router.push("/onboarding?step=4");
      return;
    }
    if (fromBilling) {
      router.push(PHARMACY_ROUTES.billing);
      return;
    }
    router.push(PHARMACY_ROUTES.settings);
  };

  return (
    <div className="flex min-h-screen bg-white justify-center">
      <div className="absolute top-6 left-6 z-10">
        <AuthBrandingLogo />
      </div>

      <div className="flex w-full flex-col items-center justify-center py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">

          <StatusIcon status={uiStatus} />

          <h1 className="text-3xl font-bold text-gray-900 text-center">{title}</h1>
          <p className="mt-2 text-base text-gray-500 leading-relaxed text-center">{message}</p>

          {uiStatus === "success" ? (
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={goNext}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Continue
              </button>
            </div>
          ) : null}

          {uiStatus === "failed" ? (
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => router.push(PHARMACY_ROUTES.settings)}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-red-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              >
                Try again
              </button>
              <button
                onClick={() => router.push("/app")}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border/80 bg-background/80 text-sm font-medium text-foreground backdrop-blur-sm hover:bg-muted/60"
              >
                Go to app
              </button>
            </div>
          ) : null}

          {uiStatus === "checking" ? (
            <p className="flex items-center justify-center gap-1.5 pt-4 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0" />
              Secure checkout — do not close this tab
            </p>
          ) : null}
        </div>
      </div>

    </div>
  );
}
