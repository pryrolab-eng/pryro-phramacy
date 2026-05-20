"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, type Message } from "@/components/form-message";
import { Loader2 } from "lucide-react";

type Props = {
  initialMessage?: Message;
};

export function ForgotPasswordForm({ initialMessage }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(
    initialMessage ?? null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage({ error: "Email is required." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/recovery-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmed,
        next: "/dashboard/reset-password",
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage({ error: data.error || "Could not send reset email." });
      return;
    }

    setMessage({
      success: data.message || "Check your email for a password reset link.",
    });
  };

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
        className="flex items-center gap-2 rounded-full bg-gray-950 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-60 w-fit"
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

      {message ? <FormMessage message={message} /> : null}

      <p className="text-sm text-gray-500">
        Remember your password?{" "}
        <Link href="/sign-in" className="font-medium text-gray-900 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
