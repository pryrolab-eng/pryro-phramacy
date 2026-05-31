import { signInAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
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
    <AuthPageShell
      title="Sign In"
      description="Welcome back to your pharmacy platform"
      panelPosition="right"
    >
      <AuthIntentShell source="sign-in" />

      <form className="mt-8 space-y-5" action={signInAction}>
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
            required
            className="w-full rounded-none border-0 border-b border-gray-200 bg-transparent pb-2 pl-9 pr-10 pt-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-0"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-blue-500 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="pt-2">
          <SubmitButton
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            pendingText="Signing in..."
            formAction={signInAction}
          >
            Sign In
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

        <p className="text-sm text-gray-500">
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
      </form>
    </AuthPageShell>
  );
}
