"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  PaymentStatusPrimaryButton,
  PaymentStatusScreen,
  PaymentStatusSecondaryButton,
} from "@/components/payment/payment-status-screen";
import { usePaymentSuccessStatus } from "@/hooks/usePaymentSuccessStatus";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

export function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const provider = searchParams.get("provider");
  const checkoutId = searchParams.get("checkout_id");
  const tid = searchParams.get("tid");
  const refid = searchParams.get("refid");

  const verification = usePaymentSuccessStatus({
    provider,
    checkoutId,
    tid,
    refid,
  });

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

  const uiStatus =
    verification.isPending
      ? "checking"
      : verification.data?.status === "completed"
        ? "success"
        : "failed";

  const message = verification.isPending
    ? "Verifying your payment…"
    : verification.isError
      ? "Unable to verify payment status."
      : verification.data?.message ?? "Unable to verify payment status.";

  const title =
    uiStatus === "checking"
      ? "Processing payment"
      : uiStatus === "success"
        ? "Payment successful"
        : "Payment failed";

  return (
    <PaymentStatusScreen status={uiStatus} title={title} message={message}>
      {uiStatus === "success" ? (
        <PaymentStatusPrimaryButton onClick={goNext}>
          Continue
        </PaymentStatusPrimaryButton>
      ) : null}
      {uiStatus === "failed" ? (
        <>
          <PaymentStatusPrimaryButton
            onClick={() => router.push(PHARMACY_ROUTES.settings)}
          >
            Try again
          </PaymentStatusPrimaryButton>
          <PaymentStatusSecondaryButton onClick={() => router.push("/app")}>
            Go to app
          </PaymentStatusSecondaryButton>
        </>
      ) : null}
    </PaymentStatusScreen>
  );
}
