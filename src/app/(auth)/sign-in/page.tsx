import { AuthBrandingLogo, AuthBrandingFooter } from "@/components/auth-branding";
import { AuthIntentShell } from "@/components/auth/auth-intent-shell";
import { EmailNotConfirmedAlert } from "@/components/auth/email-not-confirmed-alert";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpLink } from "@/components/auth/sign-up-link";
import Link from "next/link";
import { Suspense } from "react";

interface LoginProps {
  searchParams: Promise<{ error?: string; email?: string }>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const params = await searchParams;
  const initialEmail =
    typeof params.email === "string" ? params.email.trim() : "";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Top-left logo */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <AuthBrandingLogo />
        </Link>
      </div>

      {/* Left — form */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Back button */}
          <Link
            href="/"
            className="mb-8 inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="mt-2 text-base text-gray-500 leading-relaxed">
            Welcome back to your pharmacy platform
          </p>

          <AuthIntentShell source="sign-in" />

          <EmailNotConfirmedAlert />

          <div className="mt-8">
            <SignInForm initialEmail={initialEmail} />
          </div>

          <p className="mt-6 text-base text-gray-500 leading-relaxed">
            Don&apos;t have an account?{" "}
            <Suspense
              fallback={
                <Link
                  href="/sign-up"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Sign up
                </Link>
              }
            >
              <SignUpLink className="font-medium text-blue-600 hover:underline" />
            </Suspense>
          </p>
        </div>
      </div>

      {/* Right — black panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/20" />
        <div className="absolute bottom-10 -left-16 h-56 w-56 rounded-full bg-white/15" />
        <div className="absolute top-1/2 right-0 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-6 px-12">
          <div className="w-96 text-center">
            <h2 className="text-3xl font-bold text-white leading-snug">Pharmacy Management Made Simple</h2>
            <p className="mt-2 text-base text-white/80 leading-relaxed">Manage inventory, sales, prescriptions, and staff — all in one place.</p>
          </div>

          <div className="flex w-96 flex-wrap justify-center gap-3">
            {["POS & Sales", "Inventory", "Prescriptions", "Insurance", "Reports", "Multi-Branch"].map((f) => (
              <span key={f} className="rounded-[10px] bg-white/15 px-3 py-1 text-sm font-medium text-white border border-white/25">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <AuthBrandingFooter />

      </div>
    </div>
  );
}

