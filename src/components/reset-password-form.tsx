"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage, type Message } from "@/components/form-message";
import { Loader2 } from "lucide-react";

type Props = {
  initialMessage?: Message;
};

/** Supabase recovery links often return tokens in the hash (#access_token=...), not ?code=. */
function getHashParams(): URLSearchParams | null {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  return params.has("access_token") ? params : null;
}

function clearUrlCredentials() {
  window.history.replaceState({}, "", "/dashboard/reset-password");
}

export function ResetPasswordForm({ initialMessage }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState<Message | null>(initialMessage ?? null);

  useEffect(() => {
    const establishSession = async () => {
      const supabase = createClient();
      const hashParams = getHashParams();
      const queryParams = new URLSearchParams(window.location.search);
      const code = queryParams.get("code");
      const token_hash = queryParams.get("token_hash");
      const type = queryParams.get("type") ?? hashParams?.get("type");

      try {
        if (hashParams) {
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          if (!access_token || !refresh_token) {
            throw new Error("Missing tokens in reset link");
          }
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          clearUrlCredentials();
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          clearUrlCredentials();
        } else if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "recovery" | "email",
          });
          if (error) throw error;
          clearUrlCredentials();
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setMessage({
            error:
              "Your reset link expired or is invalid. Request a new one from Forgot password.",
          });
          setSessionReady(false);
        } else {
          setSessionReady(true);
        }
      } catch {
        setMessage({
          error:
            "Your reset link expired or is invalid. Request a new one from Forgot password.",
        });
        setSessionReady(false);
      } finally {
        setCheckingSession(false);
      }
    };

    void establishSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!password || !confirmPassword) {
      setMessage({ error: "Password fields are required." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ error: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setMessage({ error: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMessage({
        error:
          "Your reset link expired or is invalid. Request a new one from Forgot password.",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ error: error.message });
      return;
    }

    await supabase.auth.signOut();
    router.push("/sign-in?success=" + encodeURIComponent(
      "Your password was updated. Sign in with your new password."
    ));
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
      </div>
    );
  }

  if (!sessionReady) {
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
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Please enter your new password below.
        </p>
      </div>

      <div className="space-y-4">
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

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password…
          </>
        ) : (
          "Reset password"
        )}
      </Button>

      {message ? <FormMessage message={message} /> : null}
    </form>
  );
}
