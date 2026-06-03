"use client";

import { Check, CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { Button } from "@/components/ui/button";
import { AuthBrandingLogo } from "@/components/auth-branding";
import { cn } from "@/lib/utils";

export type PaymentStatusVariant = "checking" | "success" | "failed";

type StatusTheme = {
  page: string;
  glow: string;
  glowSecondary: string;
  iconWrap: string;
  iconRing: string;
  badge: string;
  title: string;
  message: string;
  primaryBtn: string;
};

const THEMES: Record<PaymentStatusVariant, StatusTheme> = {
  checking: {
    page: "bg-gradient-to-b from-sky-50/90 via-background to-amber-50/50 dark:from-sky-950/40 dark:via-background dark:to-amber-950/20",
    glow: "bg-sky-400/30 dark:bg-sky-500/15",
    glowSecondary: "bg-amber-300/25 dark:bg-amber-500/10",
    iconWrap: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    iconRing: "ring-sky-200/80 dark:ring-sky-800/60",
    badge: "border-sky-200/70 bg-sky-600 text-white dark:border-sky-800 dark:bg-sky-600",
    title: "text-foreground",
    message: "text-muted-foreground",
    primaryBtn:
      "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500",
  },
  success: {
    page: "bg-gradient-to-b from-emerald-50/90 via-background to-teal-50/40 dark:from-emerald-950/35 dark:via-background dark:to-teal-950/20",
    glow: "bg-emerald-400/30 dark:bg-emerald-500/15",
    glowSecondary: "bg-teal-300/20 dark:bg-teal-500/10",
    iconWrap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    iconRing: "ring-emerald-200/80 dark:ring-emerald-800/60",
    badge: "border-emerald-200/70 bg-emerald-600 text-white dark:border-emerald-800 dark:bg-emerald-600",
    title: "text-foreground",
    message: "text-muted-foreground",
    primaryBtn:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  },
  failed: {
    page: "bg-gradient-to-b from-red-50/90 via-background to-rose-50/40 dark:from-red-950/35 dark:via-background dark:to-rose-950/20",
    glow: "bg-red-400/25 dark:bg-red-500/12",
    glowSecondary: "bg-rose-300/20 dark:bg-rose-500/10",
    iconWrap: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    iconRing: "ring-red-200/80 dark:ring-red-800/60",
    badge: "border-red-200/70 bg-red-600 text-white dark:border-red-800 dark:bg-red-600",
    title: "text-foreground",
    message: "text-muted-foreground",
    primaryBtn:
      "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
  },
};

type PaymentStatusScreenProps = {
  status: PaymentStatusVariant;
  title: string;
  message: string;
  children?: React.ReactNode;
  className?: string;
};

function StatusIcon({ status }: { status: PaymentStatusVariant }) {
  const theme = THEMES[status];

  if (status === "checking") {
    return (
      <div className="relative mx-auto mb-8 flex size-20 items-center justify-center">
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-30",
            theme.glow,
          )}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -inset-2 rounded-full opacity-60 blur-md",
            theme.glowSecondary,
          )}
          aria-hidden
        />
        <div
          className={cn(
            "relative flex size-20 items-center justify-center rounded-2xl ring-4",
            theme.iconWrap,
            theme.iconRing,
          )}
        >
          <Loader2 className="size-9 animate-spin" strokeWidth={1.75} />
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="relative mx-auto mb-8 flex size-20 items-center justify-center">
        <span
          className={cn(
            "absolute -inset-3 rounded-full opacity-70 blur-xl",
            theme.glow,
          )}
          aria-hidden
        />
        <div
          className={cn(
            "relative flex size-20 items-center justify-center rounded-2xl ring-4",
            theme.iconWrap,
            theme.iconRing,
          )}
        >
          <Check className="size-9" strokeWidth={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto mb-8 flex size-20 items-center justify-center">
      <span
        className={cn(
          "absolute -inset-3 rounded-full opacity-60 blur-xl",
          theme.glow,
        )}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex size-20 items-center justify-center rounded-2xl ring-4",
          theme.iconWrap,
          theme.iconRing,
        )}
      >
        <X className="size-9" strokeWidth={2} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatusVariant }) {
  const labels: Record<PaymentStatusVariant, string> = {
    checking: "Payment in progress",
    success: "Payment confirmed",
    failed: "Payment not completed",
  };
  const theme = THEMES[status];

  return (
    <span
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        theme.badge,
      )}
    >
      <CreditCard className="size-3.5" />
      {labels[status]}
    </span>
  );
}

export function PaymentStatusScreen({
  status,
  title,
  message,
  children,
  className,
}: PaymentStatusScreenProps) {
  const theme = THEMES[status];

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12",
        theme.page,
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-[18%] size-[28rem] -translate-x-1/2 rounded-full blur-3xl",
          theme.glow,
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-[10%] right-[8%] size-48 rounded-full blur-3xl",
          theme.glowSecondary,
        )}
        aria-hidden
      />

      <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
        <AuthBrandingLogo />
      </div>

      <div
        className="relative z-10 w-full max-w-lg text-center"
        role="status"
        aria-live="polite"
      >
        <StatusBadge status={status} />
        <StatusIcon status={status} />

        <h1
          className={cn(
            "text-3xl font-semibold tracking-tight sm:text-4xl",
            theme.title,
          )}
        >
          {title}
        </h1>
        <p className={cn("mx-auto mt-3 max-w-md text-base leading-relaxed", theme.message)}>
          {message}
        </p>

        {status === "checking" ? (
          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-left">
            {[
              "Confirming payment with the provider",
              "Activating your subscription",
              "Preparing your dashboard",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3.5 py-2.5 backdrop-blur-sm dark:bg-background/40"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                    index === 0
                      ? "bg-sky-600 text-white dark:bg-sky-600"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index === 0 ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    index === 0 ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </div>
            ))}
            <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0" />
              Secure checkout — do not close this tab
            </p>
          </div>
        ) : null}

        {children ? (
          <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

export function PaymentStatusPrimaryButton({
  children,
  onClick,
  className,
  asChild,
  status = "success",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
  status?: PaymentStatusVariant;
}) {
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      type={asChild ? undefined : "button"}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold shadow-sm transition-colors",
        THEMES[status].primaryBtn,
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function PaymentStatusSecondaryButton({
  children,
  onClick,
  className,
  asChild,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      type={asChild ? undefined : "button"}
      variant={asChild ? undefined : "outline"}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-lg border border-border/80 bg-background/80 text-sm font-medium text-foreground backdrop-blur-sm hover:bg-muted/60",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function PaymentStatusScreenFallback() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50/90 via-background to-amber-50/50 px-6 dark:from-sky-950/40 dark:to-amber-950/20">
      <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
        <AuthBrandingLogo />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <Loader2 className="size-10 animate-spin text-sky-600 dark:text-sky-400" />
        <p className="text-sm text-muted-foreground">Loading payment status…</p>
      </div>
    </div>
  );
}
