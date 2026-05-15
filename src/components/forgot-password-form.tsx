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
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Reset Password</h1>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="text-primary font-medium hover:underline transition-all"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>

      {message ? <FormMessage message={message} /> : null}
    </form>
  );
}
