"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Clock,
  CreditCard,
  GitBranch,
  LifeBuoy,
  Mail,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import {
  DashboardButton,
  DashboardMetricGrid,
  DashboardPageShell,
  DashboardSectionCard,
  DashboardStatCard,
} from "@/components/dashboard";
import { usePharmacyBrandingOptional } from "@/components/pharmacy/pharmacy-branding-provider";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { useAccessBlockMessaging } from "@/hooks/useAccessBlockMessaging";
import { usePlatformSupport } from "@/hooks/usePlatformSupport";
import type { AccessBlockMessaging } from "@/lib/subscription/access-block";
import type { PharmacyAccessBlockReason } from "@/lib/subscription/access-block";
import { BILLING_ROUTE } from "@/lib/subscription/subscription-grace-routes";
import { cn } from "@/lib/utils";

function formatPlanName(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Trial";
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

type BlockTheme = {
  Icon: LucideIcon;
  hero: string;
  heroGlow: string;
  badge: string;
  iconWrap: string;
  statRing: string;
  ctaPrimary: string;
  stepNumber: string;
};

function getBlockTheme(
  variant: AccessBlockMessaging["badgeVariant"],
  reason: PharmacyAccessBlockReason,
): BlockTheme {
  if (variant === "destructive") {
    return {
      Icon: reason === "pharmacy_inactive" ? Ban : ShieldAlert,
      hero:
        "border-red-200/80 bg-gradient-to-br from-red-500/[0.12] via-red-50/80 to-background dark:border-red-900/50 dark:from-red-500/20 dark:via-red-950/30 dark:to-background",
      heroGlow:
        "pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-red-400/20 blur-3xl dark:bg-red-600/15",
      badge:
        "border-red-300/60 bg-red-600 text-white shadow-sm shadow-red-600/25 dark:border-red-700 dark:bg-red-600",
      iconWrap:
        "bg-red-100 text-red-700 ring-4 ring-red-100/80 dark:bg-red-950 dark:text-red-300 dark:ring-red-900/60",
      statRing: "ring-1 ring-red-100/80 dark:ring-red-900/40",
      ctaPrimary:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
      stepNumber: "bg-red-600 text-white",
    };
  }

  if (variant === "amber") {
    return {
      Icon:
        reason === "pending_payment" || reason === "past_due"
          ? CreditCard
          : Clock,
      hero:
        "border-amber-200/80 bg-gradient-to-br from-amber-400/[0.14] via-amber-50/90 to-background dark:border-amber-900/50 dark:from-amber-500/15 dark:via-amber-950/35 dark:to-background",
      heroGlow:
        "pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-500/10",
      badge:
        "border-amber-300/70 bg-amber-500 text-amber-950 shadow-sm shadow-amber-500/20 dark:border-amber-700 dark:bg-amber-500 dark:text-amber-950",
      iconWrap:
        "bg-amber-100 text-amber-800 ring-4 ring-amber-100/90 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900/50",
      statRing: "ring-1 ring-amber-100/90 dark:ring-amber-900/40",
      ctaPrimary:
        "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400",
      stepNumber: "bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950",
    };
  }

  return {
    Icon: AlertTriangle,
    hero:
      "border-neutral-200/80 bg-gradient-to-br from-neutral-200/40 via-neutral-50/50 to-background dark:border-neutral-800 dark:from-neutral-800/40 dark:via-neutral-900/30",
    heroGlow:
      "pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-neutral-400/15 blur-3xl",
    badge:
      "border-neutral-300/60 bg-neutral-700 text-white dark:border-neutral-600 dark:bg-neutral-600",
    iconWrap:
      "bg-neutral-100 text-neutral-700 ring-4 ring-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-800",
    statRing: "ring-1 ring-neutral-200/80 dark:ring-neutral-800",
    ctaPrimary: "",
    stepNumber: "bg-neutral-700 text-white",
  };
}

/** Unified inactive-access home for owners and staff. */
export function SubscriptionWelcomeHome() {
  const { pharmacyName } = usePharmacyBrandingOptional();
  const { entitlements } = usePharmacyEntitlements();
  const { supportMailto } = usePlatformSupport();
  const { messaging, isOwner, canAccessBilling, reason } =
    useAccessBlockMessaging();

  const planName = formatPlanName(
    entitlements.effectivePlan?.name ?? entitlements.effectivePlanLabel,
  );
  const { usage, limits } = entitlements;
  const theme = getBlockTheme(messaging.badgeVariant, reason);
  const { Icon: StatusIcon } = theme;

  const statusEyebrow =
    reason === "pharmacy_suspended" || reason === "pharmacy_inactive"
      ? messaging.shortLabel
      : `${planName} plan · ${messaging.shortLabel}`;

  const nextSteps = getNextSteps(reason, isOwner, canAccessBilling);

  return (
    <DashboardPageShell className="max-w-5xl">
      <header className="mb-6">
        <p className="text-sm font-medium text-muted-foreground">
          {pharmacyName ? pharmacyName : "Your pharmacy"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Welcome back
        </h1>
      </header>

      <section
        className={cn(
          "relative mb-6 overflow-hidden rounded-2xl border p-6 md:p-8",
          theme.hero,
        )}
      >
        <div className={theme.heroGlow} aria-hidden />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4 md:gap-5">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl md:size-16",
                theme.iconWrap,
              )}
            >
              <StatusIcon className="size-7 md:size-8" strokeWidth={1.75} />
            </div>

            <div className="min-w-0 space-y-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  theme.badge,
                )}
              >
                <span className="size-1.5 rounded-full bg-current opacity-80" />
                {statusEyebrow}
              </span>

              <h2 className="text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
                {messaging.title}
              </h2>

              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {messaging.description}
              </p>

              {!isOwner && messaging.staffNote ? (
                <div className="flex gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/90 px-3.5 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/50">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/90">
                    {messaging.staffNote}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
            {canAccessBilling ? (
              <DashboardButton
                asChild
                className={cn("h-10 px-4 font-semibold", theme.ctaPrimary)}
              >
                <Link href={BILLING_ROUTE}>
                  <CreditCard className="mr-2 size-4" />
                  {messaging.billingCta}
                  <ArrowRight className="ml-1 size-4 opacity-80" />
                </Link>
              </DashboardButton>
            ) : (
              <DashboardButton
                asChild
                className={cn("h-10 px-4 font-semibold", theme.ctaPrimary)}
              >
                <a
                  href={supportMailto(
                    `Reactivate pharmacy: ${pharmacyName ?? "my store"}`,
                  )}
                >
                  <LifeBuoy className="mr-2 size-4" />
                  Contact support
                </a>
              </DashboardButton>
            )}
            <DashboardButton tone="outline" asChild className="h-10 bg-background/80">
              <a href={supportMailto(`Help with ${pharmacyName ?? "pharmacy"} access`)}>
                <Mail className="mr-2 size-4" />
                Email support
              </a>
            </DashboardButton>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {nextSteps.map((step, index) => (
          <NextStepCard
            key={step.title}
            index={index + 1}
            {...step}
            stepNumberClass={theme.stepNumber}
          />
        ))}
      </div>

      <div className="mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account snapshot
        </h3>
      </div>

      <DashboardMetricGrid className="mb-6 md:grid-cols-3">
        <DashboardStatCard
          label="Staff in use"
          value={`${usage.activeUsers} / ${limits.maxUsers}`}
          icon={Users}
          className={theme.statRing}
        />
        <DashboardStatCard
          label="Branches in use"
          value={`${usage.activeBranches} / ${limits.totalBranchSlots}`}
          icon={GitBranch}
          className={theme.statRing}
        />
        <DashboardStatCard
          label="Plan"
          value={planName}
          icon={Sparkles}
          className={cn("col-span-2 md:col-span-1", theme.statRing)}
        />
      </DashboardMetricGrid>

      {canAccessBilling ? (
        <div className="grid gap-4 md:grid-cols-2">
          <QuickActionCard
            href={BILLING_ROUTE}
            title={isOwner ? "Compare plans" : "Renew on behalf of owner"}
            description={
              isOwner
                ? "Upgrade, downgrade, or renew your main subscription."
                : "Use this only when the owner delegated billing to you."
            }
            cta="Go to billing"
            primary
            accentClass={theme.ctaPrimary}
          />
          <QuickActionCard
            href={BILLING_ROUTE}
            title="See what unlocks"
            description="Review what each plan includes before you renew."
            cta="Browse plans"
          />
        </div>
      ) : (
        <DashboardSectionCard
          title="While access is paused"
          description="These areas stay locked until your pharmacy is reactivated."
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              "Point of sale & checkout",
              "Inventory & stock transfers",
              "Reports & analytics",
              "Staff & branch management",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-200/90 bg-neutral-50/50 px-3 py-2 text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/30"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-red-400 dark:bg-red-500" />
                {item}
              </li>
            ))}
          </ul>
        </DashboardSectionCard>
      )}

      {canAccessBilling ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Tip: press{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl+K
          </kbd>{" "}
          and search &quot;billing&quot;
        </p>
      ) : null}
    </DashboardPageShell>
  );
}

function getNextSteps(
  reason: PharmacyAccessBlockReason,
  isOwner: boolean,
  canAccessBilling: boolean,
): { title: string; description: string }[] {
  if (reason === "pharmacy_suspended" || reason === "pharmacy_inactive") {
    return isOwner
      ? [
          {
            title: "Contact Pryrox",
            description:
              "Email support with your pharmacy name. We will confirm why the store was suspended.",
          },
          {
            title: "Talk to your admin",
            description:
              "If a platform admin suspended the store, they must reactivate it from Admin → Stores.",
          },
          {
            title: "Avoid duplicate payments",
            description:
              "Renewing billing alone may not restore access until the suspension is cleared.",
          },
        ]
      : [
          {
            title: "Notify the owner",
            description:
              "Share this screen so they know the location is suspended.",
          },
          {
            title: "Do not pay yet",
            description:
              "Billing is disabled until support or an admin reactivates the store.",
          },
          {
            title: "Need help?",
            description:
              "Use Email support if the owner asked you to escalate to Pryrox.",
          },
        ];
  }

  if (canAccessBilling) {
    return isOwner
      ? [
          {
            title: "Open billing",
            description: "Pick a plan or complete an outstanding payment.",
          },
          {
            title: "Confirm payment",
            description: "Card or mobile money — access restores after activation.",
          },
          {
            title: "Return to work",
            description: "POS, inventory, and reports unlock automatically.",
          },
        ]
      : [
          {
            title: "Check with owner",
            description: "Confirm they want you to complete payment.",
          },
          {
            title: "Open billing",
            description: "Use the billing area only if they delegated it to you.",
          },
          {
            title: "Refresh this page",
            description: "After payment, reload to see the dashboard unlock.",
          },
        ];
  }

  return [
    {
      title: "Review status",
      description: "Read the message above for why access is limited.",
    },
    {
      title: "Contact support",
      description: "We can clarify what is needed to restore your pharmacy.",
    },
    {
      title: "Check back later",
      description: "Status updates may take a few minutes to appear here.",
    },
  ];
}

function NextStepCard({
  index,
  title,
  description,
  stepNumberClass,
}: {
  index: number;
  title: string;
  description: string;
  stepNumberClass: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-card p-4 shadow-sm dark:border-neutral-800">
      <div className="flex gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
            stepNumberClass,
          )}
        >
          {index}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Compact fallback when a gated page is opened while access is blocked. */
export function SubscriptionInactiveFallback({
  featureLabel,
}: {
  featureLabel?: string;
}) {
  const { messaging, canAccessBilling, reason } = useAccessBlockMessaging();
  const { supportMailto } = usePlatformSupport();
  const theme = getBlockTheme(messaging.badgeVariant, reason);
  const { Icon: StatusIcon } = theme;

  return (
    <DashboardPageShell>
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl",
            theme.iconWrap,
          )}
        >
          <StatusIcon className="size-8" strokeWidth={1.75} />
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            theme.badge,
          )}
        >
          {messaging.shortLabel}
        </span>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {messaging.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {featureLabel
              ? `${featureLabel} unlocks when access is restored.`
              : "This area unlocks when access is restored."}{" "}
            {messaging.description}
          </p>
        </div>

        {canAccessBilling ? (
          <DashboardButton
            asChild
            className={cn("font-semibold", theme.ctaPrimary)}
          >
            <Link href={BILLING_ROUTE}>
              <CreditCard className="mr-2 size-4" />
              {messaging.billingCta}
            </Link>
          </DashboardButton>
        ) : (
          <DashboardButton
            asChild
            className={cn("font-semibold", theme.ctaPrimary)}
          >
            <a href={supportMailto(`Help with blocked feature: ${featureLabel ?? "dashboard"}`)}>
              <LifeBuoy className="mr-2 size-4" />
              Contact support
            </a>
          </DashboardButton>
        )}
      </div>
    </DashboardPageShell>
  );
}

export function SubscriptionWelcomeGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { entitlements, isHydrating, isEntitlementsReady } =
    usePharmacyEntitlements();

  if (!isHydrating && isEntitlementsReady && !entitlements.isAccessAllowed) {
    return <SubscriptionWelcomeHome />;
  }

  return <>{children}</>;
}

function QuickActionCard({
  href,
  title,
  description,
  cta,
  primary,
  accentClass,
}: {
  href: string;
  title: string;
  description: string;
  cta: string;
  primary?: boolean;
  accentClass?: string;
}) {
  return (
    <DashboardSectionCard title={title} description={description}>
      <DashboardButton
        tone={primary ? "primary" : "outline"}
        asChild
        className={primary && accentClass ? accentClass : undefined}
      >
        <Link href={href}>
          {cta}
          <ArrowRight className="ml-1.5 size-3.5 opacity-70" />
        </Link>
      </DashboardButton>
    </DashboardSectionCard>
  );
}
