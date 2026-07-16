"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { signInAction, type SignInFormState } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { showVerificationToast } from "@/components/auth/verification-toast";

type SignInFormProps = {
  initialEmail?: string;
};

export function SignInForm({ initialEmail = "" }: SignInFormProps) {
  const [state, formAction] = useActionState(signInAction, null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const lastToastState = useRef<SignInFormState>(null);

  useEffect(() => {
    if (state?.email) {
      setEmail(state.email);
    }
  }, [state?.email]);

  useEffect(() => {
    if (!state?.error || state === lastToastState.current) return;
    lastToastState.current = state;

    if (state.unconfirmed) {
      showVerificationToast({
        message: state.error,
        email: state.email,
      });
      return;
    }

    toast.error(state.error);
  }, [state]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <>
      {state?.unconfirmed ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-4 text-sm text-amber-950">
          <p className="font-medium">Confirm your email to sign in</p>
          <p className="mt-1 text-amber-900/90">
            We sent a confirmation link when you signed up. Check spam, or resend
            a new link below.
          </p>
          <div className="mt-4">
            <ResendConfirmationForm
              defaultEmail={state.email ?? email}
              emailReadOnly={Boolean(state.email ?? email)}
              submitLabel="Send new confirmation link"
            />
          </div>
        </div>
      ) : null}

      <form
        className="mt-8 space-y-5"
        method="post"
        onSubmit={handleSubmit}
      >
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
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            pendingText="Signing in..."
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
      </form>
    </>
  );
}
