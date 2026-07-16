import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthBrandingLogo } from "@/components/auth-branding";
import { PaymentSuccessContent } from "./payment-success-content";

function PaymentFallback() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="absolute top-6 left-6 z-10">
        <AuthBrandingLogo />
      </div>
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-sky-600" />
          <p className="text-sm text-gray-500">Loading payment status...</p>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/20" />
        <div className="absolute bottom-10 -left-16 h-56 w-56 rounded-full bg-white/15" />
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

