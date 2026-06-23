import { Suspense } from "react";
import { PaymentStatusScreenFallback } from "@/components/payment/payment-status-screen";
import { PaymentSuccessContent } from "./payment-success-content";

/** Post-checkout return for Polar subscription payments. */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentStatusScreenFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
