"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useResendConfirmationMutation } from "@/hooks/useAuth";

type Props = {
  defaultEmail?: string;
  emailReadOnly?: boolean;
  submitLabel?: string;
};

export function ResendConfirmationForm({
  defaultEmail = "",
  emailReadOnly = false,
  submitLabel = "Resend",
}: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const mutation = useResendConfirmationMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Email is required.");
      return;
    }

    try {
      const data = await mutation.mutateAsync({ email: trimmed });
      toast.success(
        data.message ??
          "If an account exists for this email, we sent a new confirmation link.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not resend confirmation email.";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Input
          id="resend-email"
          name="email"
          type="email"
          placeholder="Email"
          required
          readOnly={emailReadOnly && Boolean(defaultEmail)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-0 border-b border-gray-200 rounded-none bg-transparent pb-2 pt-2 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-fit items-center gap-2 rounded-[10px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
