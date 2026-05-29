import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

type ToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
};

function toMessage(value: ReactNode | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return String(value);
}

/** @deprecated Prefer `import { toast } from "sonner"` in new code. */
function toast({ title, description, variant }: ToastInput) {
  const message = toMessage(title) ?? toMessage(description) ?? "Notification";
  const desc =
    title != null && description != null ? toMessage(description) : undefined;
  const opts = desc ? { description: desc } : undefined;

  if (variant === "destructive") {
    sonnerToast.error(message, opts);
    return;
  }

  sonnerToast(message, opts);
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [] as const,
  };
}

export { useToast, toast };
