"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PaymentStatusPrimaryButton,
  PaymentStatusScreen,
  PaymentStatusSecondaryButton,
} from "@/components/payment/payment-status-screen";

export function PaymentPolarSuccessContent() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const [status, setStatus] = useState<"checking" | "success" | "failed">(
    "checking",
  );

  useEffect(() => {
    if (!checkoutId) {
      setStatus("failed");
      return;
    }
    const timer = setTimeout(() => setStatus("success"), 2000);
    return () => clearTimeout(timer);
  }, [checkoutId]);

  const title =
    status === "checking"
      ? "Confirming payment"
      : status === "success"
        ? "Payment successful"
        : "Something went wrong";

  const message =
    status === "checking"
      ? "Please wait while we activate your subscription."
      : status === "success"
        ? "Your Pryrox subscription is now active. You can start managing your pharmacy right away."
        : "We could not confirm your payment. Please contact support if you were charged.";

  return (
    <PaymentStatusScreen status={status} title={title} message={message}>
      {status === "success" ? (
        <>
          <PaymentStatusPrimaryButton asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </PaymentStatusPrimaryButton>
          <PaymentStatusSecondaryButton asChild>
            <Link href="/">Back to home</Link>
          </PaymentStatusSecondaryButton>
        </>
      ) : null}
      {status === "failed" ? (
        <PaymentStatusSecondaryButton asChild>
          <Link href="/">Back to home</Link>
        </PaymentStatusSecondaryButton>
      ) : null}
    </PaymentStatusScreen>
  );
}
