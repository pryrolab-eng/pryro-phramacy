import Link from "next/link";
import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { VerifyEmailContent } from "@/components/auth/verify-email-content";
import { SmtpMessage } from "@/app/(auth)/smtp-message";

type Props = {
  searchParams: Promise<{ email?: string; expired?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email?.trim() ?? "";
  const expired = params.expired === "1";

  return (
    <AuthPageShell
      title="Check your email"
      description="Confirm your address to continue setting up Pryrox"
      panelPosition="left"
      logoOnDarkPanel
    >
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <VerifyEmailContent initialEmail={email} linkExpired={expired} />
      </Suspense>
      <div className="mt-8">
        <SmtpMessage />
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Already confirmed?{" "}
        <Link href="/sign-in" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
