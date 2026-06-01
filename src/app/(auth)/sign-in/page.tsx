import { AuthPageShell } from "@/components/auth/auth-page-shell";
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
    <AuthPageShell
      title="Sign In"
      description="Welcome back to your pharmacy platform"
      panelPosition="right"
    >
      <AuthIntentShell source="sign-in" />

      <EmailNotConfirmedAlert />

      <SignInForm initialEmail={initialEmail} />

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
    </AuthPageShell>
  );
}
