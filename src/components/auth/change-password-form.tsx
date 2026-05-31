"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { DashboardButton } from "@/components/dashboard";
import { useChangePasswordMutation } from "@/hooks/useChangePassword";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/must-change-password";

type Props = {
  /** First login after invite — hide current password field. */
  forced?: boolean;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function ChangePasswordForm({
  forced = false,
  onSuccess,
  submitLabel = "Update password",
}: Props) {
  const mutation = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({
        currentPassword: forced ? undefined : currentPassword,
        newPassword,
        confirmPassword,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {forced ? (
        <p className="text-sm text-muted-foreground">
          You are using a temporary password from your invitation. Choose a new
          password to continue.
        </p>
      ) : null}

      {!forced ? (
        <div className="grid gap-2">
          <Label htmlFor="current-password">Current password</Label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <DashboardButton
        type="submit"
        tone="primary"
        className="w-full"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Updating…
          </>
        ) : (
          submitLabel
        )}
      </DashboardButton>
    </form>
  );
}
