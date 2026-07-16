import { AuthBrandingLogo, AuthBrandingFooter } from "@/components/auth-branding";
import { AuthIntentShell } from "@/components/auth/auth-intent-shell";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { Suspense } from "react";
import { signUpAction } from "@/app/actions";
import { UrlProvider } from "@/components/url-provider";
import { SignInLink } from "@/components/auth/sign-in-link";

export default async function Signup() {
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

          <h1 className="text-3xl font-bold text-gray-900">Sign Up</h1>
          <p className="mt-2 text-sm text-gray-500">
            Create your account to get started
          </p>

          <AuthIntentShell source="sign-up" />

          <div className="mt-8">
            <UrlProvider>
              <form className="space-y-5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </span>
                  <Input
                    name="full_name"
                    type="text"
                    placeholder="Full Name"
                    required
                    className="w-full rounded-none border-0 border-b border-gray-200 bg-transparent pb-2 pl-9 pt-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-0"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="w-full rounded-none border-0 border-b border-gray-200 bg-transparent pb-2 pl-9 pt-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-0"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <PasswordInput
                    name="password"
                    placeholder="Password"
                    minLength={6}
                    required
                    className="w-full rounded-none border-0 border-b border-gray-200 bg-transparent pb-2 pl-9 pr-10 pt-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-0"
                  />
                </div>

                <div className="pt-2">
                  <SubmitButton
                    formAction={signUpAction}
                    pendingText="Signing up..."
                    className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Sign Up
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </SubmitButton>
                </div>

                <p className="text-base text-gray-500 leading-relaxed">
                  Already have an account?{" "}
                  <Suspense
                    fallback={
                      <Link
                        href="/sign-in"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Sign in
                      </Link>
                    }
                  >
                    <SignInLink className="font-medium text-blue-600 hover:underline" />
                  </Suspense>
                </p>
              </form>
            </UrlProvider>
          </div>
        </div>
      </div>

      {/* Right — black panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/20" />
        <div className="absolute bottom-10 -left-16 h-56 w-56 rounded-full bg-white/15" />
        <div className="absolute top-1/2 right-0 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-6 px-12">
          <div className="w-96 text-center">
            <h2 className="text-3xl font-bold text-white leading-snug">Start Managing Your Pharmacy</h2>
            <p className="mt-2 text-base text-white/80 leading-relaxed">Join pharmacies using Pryrox to streamline operations and boost efficiency.</p>
          </div>

          <div className="flex w-96 flex-wrap justify-center gap-3">
            {["Easy Setup", "Free Trial", "No Credit Card", "24/7 Support"].map((f) => (
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

