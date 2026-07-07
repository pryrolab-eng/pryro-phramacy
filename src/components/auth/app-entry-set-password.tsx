"use client";

import { AuthBrandingLogo } from "@/components/auth-branding";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

type Props = {
  onComplete: () => void;
};

/** Shown on `/app` when invite users must replace a temporary password. */
export function AppEntrySetPassword({ onComplete }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <AuthBrandingLogo />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
          Set your password
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          For security, replace your temporary invitation password before
          continuing.
        </p>

        <div className="mt-8">
          <ChangePasswordForm
            forced
            submitLabel="Continue"
            onSuccess={onComplete}
          />
        </div>
      </div>
    </div>
  );
}
