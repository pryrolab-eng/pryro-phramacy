"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage, type Message } from "@/components/form-message";
import { Loader2 } from "lucide-react";
import { RESET_PASSWORD_PATH } from "@/lib/middleware/auth-routes";
import { resetPasswordAction } from "@/app/actions";

type Props = {
  initialMessage?: Message;
};

export function ResetPasswordForm({ initialMessage }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState<Message | null>(initialMessage ?? null);
  const [nativeToken, setNativeToken] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const native_token = queryParams.get("native_token");
    if (native_token) {
      setNativeToken(native_token);
    } else {
      setMessage({
        error:
          "Your reset link expired or is invalid. Request a new one from Forgot password.",
      });
    }
    setCheckingSession(false);
  }, []);

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
      </div>
    );
  }

  if (!nativeToken) {
    return (
      <div className="space-y-4">
        {message ? <FormMessage message={message} /> : null}
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-primary underline">
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={resetPasswordAction} className="flex flex-col space-y-4">
      <input type="hidden" name="native_token" value={nativeToken} />
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            New password
          </Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="New password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Button type="submit" className="w-full rounded-[10px]">
        Reset password
      </Button>

      {message ? <FormMessage message={message} /> : null}
    </form>
  );
}
