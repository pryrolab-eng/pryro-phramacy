import { Suspense } from "react";
import { PaymentPolarSuccessContent } from "./payment-polar-success-content";

function PaymentPolarFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentPolarFallback />}>
      <PaymentPolarSuccessContent />
    </Suspense>
  );
}
