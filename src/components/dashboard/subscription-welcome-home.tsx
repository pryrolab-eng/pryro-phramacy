"use client";

import Link from "next/link";
import {
  Bell,
  CreditCard,
  GitBranch,
  Sparkles,
  Users,
} from "lucide-react";
import {
  DashboardButton,
  DashboardMetricGrid,
  DashboardPageHeader,
  DashboardPageShell,
  DashboardSectionCard,
  DashboardStatCard,
} from "@/components/dashboard";
import { usePharmacyBrandingOptional } from "@/components/pharmacy/pharmacy-branding-provider";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import {
  BILLING_ROUTE,
  isPharmacyOwnerRole,
} from "@/lib/subscription/subscription-grace-routes";

function formatPlanName(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Trial";
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Unified inactive-subscription home for owners and staff. */
export function SubscriptionWelcomeHome() {
  const { pharmacyName } = usePharmacyBrandingOptional();
  const { context } = useActivePharmacy();
  const { entitlements } = usePharmacyEntitlements();

  const planName = formatPlanName(
    entitlements.effectivePlan?.name ?? entitlements.effectivePlanLabel,
  );
  const isOwner = isPharmacyOwnerRole(context.role);
  const { usage, limits } = entitlements;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title={`Welcome back${pharmacyName ? `, ${pharmacyName}` : ""}`}
        description={
          isOwner
            ? "Your workspace is paused until you renew or choose a plan."
            : "Operations are paused. Let the owner know — or renew here if they asked you to."
        }
      />

      <div className="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-background p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              {planName} · inactive
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {isOwner
                ? "Pick up where you left off"
                : "Subscription needs attention"}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isOwner
                ? "Renew to unlock POS, inventory, reports, and the rest of your operations. Billing is open so you can choose a plan now."
                : "Tell the pharmacy owner the plan is inactive. If they share payment details with you, you can renew from billing on their behalf."}
            </p>
            {!isOwner ? (
              <div className="flex items-start gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
                <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Tip for staff: screenshot this page or note the plan status,
                  then message the owner. Only open billing if they explicitly
                  asked you to complete payment.
                </p>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Press{" "}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl+K
              </kbd>{" "}
              and search &quot;billing&quot; to jump there quickly.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <DashboardButton tone="primary" asChild>
              <Link href={BILLING_ROUTE}>
                <CreditCard className="mr-2 size-4" />
                {isOwner ? "View plans & billing" : "Open billing to renew"}
              </Link>
            </DashboardButton>
          </div>
        </div>
      </div>

      <DashboardMetricGrid className="mb-8 md:grid-cols-3">
        <DashboardStatCard
          label="Staff in use"
          value={`${usage.activeUsers} / ${limits.maxUsers}`}
          icon={Users}
        />
        <DashboardStatCard
          label="Branches in use"
          value={`${usage.activeBranches} / ${limits.totalBranchSlots}`}
          icon={GitBranch}
        />
        <DashboardStatCard
          label="Plan"
          value={planName}
          icon={Sparkles}
          className="col-span-2 md:col-span-1"
        />
      </DashboardMetricGrid>

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
        />
        <QuickActionCard
          href={BILLING_ROUTE}
          title="See what unlocks"
          description="Review what each plan includes before you renew."
          cta="Browse plans"
        />
      </div>
    </DashboardPageShell>
  );
}

/** Compact fallback when a gated page is opened while subscription is inactive. */
export function SubscriptionInactiveFallback({
  featureLabel,
}: {
  featureLabel?: string;
}) {
  const { context } = useActivePharmacy();
  const isOwner = isPharmacyOwnerRole(context.role);

  return (
    <DashboardPageShell>
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
          <Sparkles className="size-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Subscription inactive
          </h2>
          <p className="text-sm text-muted-foreground">
            {featureLabel
              ? `${featureLabel} unlocks after renewal.`
              : "This area unlocks after renewal."}{" "}
            {isOwner
              ? "Open billing to renew or change your plan."
              : "Notify the owner, or open billing if they asked you to pay."}
          </p>
        </div>
        <DashboardButton tone="primary" asChild>
          <Link href={BILLING_ROUTE}>
            <CreditCard className="mr-2 size-4" />
            Go to billing
          </Link>
        </DashboardButton>
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
}: {
  href: string;
  title: string;
  description: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <DashboardSectionCard title={title} description={description}>
      <DashboardButton tone={primary ? "primary" : "outline"} asChild>
        <Link href={href}>{cta}</Link>
      </DashboardButton>
    </DashboardSectionCard>
  );
}
