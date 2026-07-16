"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useSendRecoveryEmailMutation } from "@/hooks/useAuth";
import { RESET_PASSWORD_PATH } from "@/lib/middleware/auth-routes";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const recoveryMutation = useSendRecoveryEmailMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Email is required.");
      return;
    }

    try {
      const data = await recoveryMutation.mutateAsync({
        email: trimmed,
        next: RESET_PASSWORD_PATH,
      });
      toast.success(
        data.message || "Check your email for a password reset link.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send reset email.";
      toast.error(message);
    }
  };

  const loading = recoveryMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </span>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-0 border-b border-gray-200 rounded-none bg-transparent pl-9 pb-2 pt-2 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-gray-900 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 w-fit"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Reset Link
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      <p className="text-sm text-gray-500">
        Remember your password?{" "}
        <Link href="/sign-in" className="font-medium text-gray-900 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
