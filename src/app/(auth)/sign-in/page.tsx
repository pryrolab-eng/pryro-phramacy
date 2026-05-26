import { signInAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthBrandingLogo, AuthBrandingFooter } from "@/components/auth-branding";
import { AuthIntentShell } from "@/components/auth/auth-intent-shell";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpLink } from "@/components/auth/sign-up-link";

interface LoginProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 lg:p-8">
      <div className="flex w-full max-w-5xl flex-col lg:flex-row relative bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[650px]">
        {/* Top-left logo */}
        <div className="absolute top-8 left-8 z-20">
          <Link href="/">
            <AuthBrandingLogo />
          </Link>
        </div>
        
        {/* Left — form */}
        <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-1/2 lg:px-16 xl:px-20 pt-32 lg:pt-12 relative">
          <div className="mx-auto w-full max-w-md">
            {/* Back button */}
            <Link
              href="/"
              className="mb-8 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
            <p className="mt-2 text-sm text-gray-500">
              Welcome back to your pharmacy platform
            </p>

            <AuthIntentShell source="sign-in" />

            <form className="mt-8 space-y-5" action={signInAction}>
              {/* Email */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full border-0 border-b border-gray-200 rounded-none bg-transparent pl-9 pb-2 pt-2 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-500 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <PasswordInput
                  name="password"
                  placeholder="Password"
                  required
                  className="w-full border-0 border-b border-gray-200 rounded-none bg-transparent pl-9 pr-10 pb-2 pt-2 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-blue-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <div className="pt-2">
                <SubmitButton
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                  pendingText="Signing in..."
                  formAction={signInAction}
                >
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </SubmitButton>
              </div>

              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Suspense fallback={<Link href="/sign-up" className="font-medium text-blue-600 hover:underline">Sign up</Link>}>
                  <SignUpLink className="font-medium text-blue-600 hover:underline" />
                </Suspense>
              </p>
            </form>
          </div>
        </div>

        {/* Right — black panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-950">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-16 h-56 w-56 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-0 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative z-10 flex w-full flex-col items-center justify-center gap-6 px-12">

            {/* Headline */}
            <div className="w-64 text-center">
              <h2 className="text-2xl font-bold text-white leading-snug">Pharmacy Management Made Simple</h2>
              <p className="mt-2 text-sm text-gray-400">Pryrox helps pharmacies manage inventory, sales, prescriptions, and staff — all in one place.</p>
            </div>

            {/* Feature pills */}
            <div className="flex w-64 flex-wrap justify-center gap-2">
              {["POS & Sales", "Inventory", "Prescriptions", "Insurance", "Reports", "Multi-Branch"].map((f) => (
                <span key={f} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white border border-white/20">
                  {f}
                </span>
              ))}
            </div>

          </div>

          {/* Footer */}
          <AuthBrandingFooter />

        </div>
      </div>
    </div>
  );
}
