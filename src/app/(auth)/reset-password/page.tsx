import { AuthBrandingLogo, AuthBrandingFooter } from "@/components/auth-branding";
import { AuthIntentShell } from "@/components/auth/auth-intent-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";
import type { Message } from "@/components/form-message";
import Link from "next/link";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  const initialMessage =
    "error" in searchParams
      ? { error: searchParams.error }
      : "success" in searchParams
        ? { success: searchParams.success }
        : undefined;

  return (
    <div className="flex min-h-screen bg-white">
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <AuthBrandingLogo />
        </Link>
      </div>

      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/sign-in"
            className="mb-8 inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose a new password for your account.
          </p>

          <AuthIntentShell source="sign-in" />

          <div className="mt-8">
            <ResetPasswordForm initialMessage={initialMessage} />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/20" />
        <div className="absolute bottom-10 -left-16 h-56 w-56 rounded-full bg-white/15" />
        <div className="absolute top-1/2 right-0 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-6 px-12">
          <div className="w-64 text-center">
            <h2 className="text-2xl font-bold text-white leading-snug">
              Secure Account Recovery
            </h2>
              <p className="mt-2 text-sm text-white/80">
              Set a strong new password to keep your pharmacy account safe.
            </p>
          </div>

          <div className="flex w-64 flex-wrap justify-center gap-2">
            {["Secure Link", "Email Verified", "Quick Reset", "Safe & Private"].map(
              (f) => (
                <span
                  key={f}
                  className="rounded-[10px] bg-white/15 px-3 py-1 text-xs font-medium text-white border border-white/25"
                >
                  {f}
                </span>
              ),
            )}
          </div>
        </div>

        <AuthBrandingFooter />
      </div>
    </div>
  );
}

