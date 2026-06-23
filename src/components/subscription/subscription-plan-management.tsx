"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  Building2,
  Check,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { planDisplayName } from "@/lib/admin/plan-stats";
import {
  catalogPlanMatchesActive,
  findCurrentCatalogPlan,
  resolveCurrentPlanPrice,
} from "@/lib/subscription/match-current-catalog-plan";
import { useActiveCatalogPlanRef } from "@/hooks/useActiveCatalogPlanRef";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";
import {
  createPendingSubscription,
  startPolarSubscriptionCheckout,
  type PaidCheckoutContext,
  type ScheduledChangeResponse,
} from "@/lib/subscription/checkout-client";
import { getPlanLimits } from "@/lib/http/subscription";
import {
  INVALID_EMAIL_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/validation/email";
import {
  useCancelScheduledChangeMutation,
  useInvalidateSubscriptionManagement,
  usePharmacySubscriptionPlan,
  usePlanLimitsQuery,
  useScheduleDowngradeMutation,
  useScheduledChangeQuery,
  useSubscriptionPlansCatalog,
  useSubscriptionStatusQuery,
} from "@/hooks/useSubscriptionManagement";
import { BranchAddonCheckoutDialog } from "@/components/subscription/branch-addon-checkout-dialog";
import { PlanCatalogSections } from "@/components/subscription/plan-catalog-sections";
import type { SubscriptionPlan as SaasSubscriptionPlan } from "@/lib/saas/types";

export type CatalogPlan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  current: boolean;
  plan_type: "main" | "branch_addon";
  monthly_tx_limit: number;
  max_users: number;
  max_branches: number;
};

type Props = {
  customerName?: string;
  customerEmail?: string;
  checkoutReturnContext?: PaidCheckoutContext;
  onPlanChanged?: () => void;
  showBranchAddons?: boolean;
  /** Tighter grid for upgrade modal vs full billing page */
  layout?: "page" | "dialog";
};

function toSaasAddonPlan(plan: CatalogPlan): SaasSubscriptionPlan {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: "per month",
    billing_period: "monthly",
    plan_type: "branch_addon",
    max_branches: 1,
    max_users: 0,
    monthly_tx_limit: plan.monthly_tx_limit,
    features: plan.features,
    is_popular: false,
    is_active: true,
    created_at: "",
    updated_at: "",
  };
}

export function SubscriptionPlanManagement({
  customerName = "Pharmacy customer",
  customerEmail = "",
  checkoutReturnContext = "settings",
  onPlanChanged,
  showBranchAddons = true,
  layout = "page",
}: Props) {
  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [addonPlans, setAddonPlans] = useState<CatalogPlan[]>([]);
  const [scheduledChange, setScheduledChange] =
    useState<ScheduledChangeResponse["scheduledChange"]>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(
    null
  );
  const [planLimitsHint, setPlanLimitsHint] = useState<string | null>(null);

  const invalidateSubscription = useInvalidateSubscriptionManagement();
  const plansQuery = useSubscriptionPlansCatalog();
  const {
    activePlan,
    isLoading: activePlanLoading,
    isError: activePlanError,
    refetch: refetchActivePlan,
  } = useActiveCatalogPlanRef();
  const { entitlements } = usePharmacyEntitlements();
  const pharmacyPlanQuery = usePharmacySubscriptionPlan();
  const scheduledQuery = useScheduledChangeQuery();
  const statusQuery = useSubscriptionStatusQuery();
  const limitsQuery = usePlanLimitsQuery();
  const scheduleDowngradeMutation = useScheduleDowngradeMutation();
  const cancelScheduledMutation = useCancelScheduledChangeMutation();

  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isDowngradeDialogOpen, setIsDowngradeDialogOpen] = useState(false);
  const [isUpgradePaymentLoading, setIsUpgradePaymentLoading] = useState(false);
  const [isSchedulingDowngrade, setIsSchedulingDowngrade] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<CatalogPlan | null>(
    null
  );
  const [selectedDowngradePlan, setSelectedDowngradePlan] =
    useState<CatalogPlan | null>(null);
  const [upgradePaymentData, setUpgradePaymentData] = useState({
    email: "",
  });

  const [addonCheckoutOpen, setAddonCheckoutOpen] = useState(false);
  const [addonPlanTarget, setAddonPlanTarget] = useState<CatalogPlan | null>(null);

  const mapCatalogRow = useCallback(
    (row: Record<string, unknown>): CatalogPlan => {
      const plan = normalizeSubscriptionPlanRow(row);
      return {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        current: catalogPlanMatchesActive(plan, activePlan),
        features: plan.features,
        plan_type: plan.plan_type,
        monthly_tx_limit: plan.monthly_tx_limit,
        max_users: Number(row.max_users ?? 0),
        max_branches: Number(row.max_branches ?? 0),
      };
    },
    [activePlan],
  );

  const applyCatalogPlans = useCallback(
    (rows: Record<string, unknown>[]) => {
      const mapped = rows.map(mapCatalogRow);
      setPlans(mapped.filter((p) => p.plan_type === "main"));
      setAddonPlans(mapped.filter((p) => p.plan_type === "branch_addon"));
    },
    [mapCatalogRow]
  );

  useEffect(() => {
    if (pharmacyPlanQuery.data?.subscriptionExpiresAt) {
      setSubscriptionExpiresAt(pharmacyPlanQuery.data.subscriptionExpiresAt);
    }
  }, [pharmacyPlanQuery.data?.subscriptionExpiresAt]);

  useEffect(() => {
    if (plansQuery.data?.length) {
      applyCatalogPlans(plansQuery.data as unknown as Record<string, unknown>[]);
      return;
    }
    if (plansQuery.isError || (plansQuery.isSuccess && !plansQuery.data?.length)) {
      const fallback = fallbackPlansForDisplay().map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        current: catalogPlanMatchesActive(plan, activePlan),
        features: plan.features,
        plan_type: "main" as const,
        monthly_tx_limit: plan.monthly_tx_limit ?? 0,
        max_users: 0,
        max_branches: 0,
      }));
      setPlans(fallback);
      setAddonPlans([]);
    }
  }, [
    plansQuery.data,
    plansQuery.isError,
    plansQuery.isSuccess,
    applyCatalogPlans,
    activePlan,
  ]);

  useEffect(() => {
    const scheduled = scheduledQuery.data?.scheduledChange ?? null;
    setScheduledChange(scheduled);
    if (statusQuery.data?.expiresAt) {
      setSubscriptionExpiresAt(statusQuery.data.expiresAt ?? null);
    }
    if (statusQuery.data?.scheduledChange) {
      setScheduledChange(statusQuery.data.scheduledChange);
    }
  }, [scheduledQuery.data, statusQuery.data]);

  useEffect(() => {
    const data = limitsQuery.data;
    if (!data) {
      setPlanLimitsHint(null);
      return;
    }
    const hints: string[] = [];
    if (data.canAddUser?.overLimit && data.canAddUser.reason) {
      hints.push(data.canAddUser.reason);
    }
    if (
      data.usage &&
      data.limits?.maxBranches != null &&
      data.usage.activeBranches > data.limits.maxBranches
    ) {
      hints.push(
        `You have ${data.usage.activeBranches} branches but your plan allows ${data.limits.maxBranches}.`,
      );
    }
    setPlanLimitsHint(hints.length > 0 ? hints.join(" ") : null);
  }, [limitsQuery.data]);

  const refreshAll = useCallback(async () => {
    await invalidateSubscription();
    onPlanChanged?.();
  }, [invalidateSubscription, onPlanChanged]);

  useEffect(() => {
    setPlans((prev) =>
      prev.map((plan) => ({
        ...plan,
        current: catalogPlanMatchesActive(plan, activePlan),
      })),
    );
  }, [activePlan]);

  const currentPlan = useMemo(
    () => findCurrentCatalogPlan(plans, activePlan),
    [plans, activePlan],
  );

  const currentPlanPrice = resolveCurrentPlanPrice(plans, activePlan);

  const subStatus = statusQuery.data?.status;
  const isPendingPayment = entitlements?.accessBlockReason === "pending_payment";
  const isFirstTimeSubscriber = subStatus === "free" || (!currentPlan && !activePlan) || isPendingPayment;
  const isExpired = subStatus === "expired";

  const pendingPlan = useMemo(() => {
    if (!isPendingPayment || !activePlan) return null;
    return plans.find(
      (p) => p.id === activePlan.id || p.name === activePlan.name,
    ) ?? null;
  }, [isPendingPayment, activePlan, plans]);

  const planActionLabel = (plan: CatalogPlan) => {
    if (isFirstTimeSubscriber) return "Subscribe";
    if (isExpired) return "Renew";
    if (plan.price > currentPlanPrice) return "Upgrade";
    return "Select";
  };

  const dialogTitlePrefix = useMemo(() => {
    if (isFirstTimeSubscriber) return "Subscribe to";
    if (isExpired) return "Renew";
    return "Upgrade to";
  }, [isFirstTimeSubscriber, isExpired]);

  const dialogDescription = useMemo(() => {
    if (isFirstTimeSubscriber)
      return "Complete payment to activate your subscription";
    if (isExpired)
      return "Complete payment to renew your subscription";
    return "Complete payment to upgrade your subscription";
  }, [isFirstTimeSubscriber, isExpired]);

  const activePlanLabel = useMemo(() => {
    if (currentPlan?.name) return currentPlan.name;
    if (activePlan?.name) return planDisplayName(activePlan.name);
    return "Your plan";
  }, [currentPlan, activePlan]);

  const upgradePlans = useMemo(
    () =>
      [...plans]
        .filter((p) => {
          if (p.current && !isPendingPayment) return false;
          if (isPendingPayment && pendingPlan && p.id === pendingPlan.id) return false;
          return p.price > currentPlanPrice;
        })
        .sort((a, b) => a.price - b.price),
    [plans, currentPlanPrice, isPendingPayment, pendingPlan],
  );

  const downgradePlans = useMemo(
    () =>
      isPendingPayment
        ? []
        : [...plans]
            .filter((p) => !p.current && p.price < currentPlanPrice)
            .sort((a, b) => b.price - a.price),
    [plans, currentPlanPrice, isPendingPayment],
  );

  const isPlanUpgrade = (plan: CatalogPlan) => plan.price > currentPlanPrice;
  const isPlanDowngrade = (plan: CatalogPlan) => plan.price < currentPlanPrice;

  const formatEffectiveDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDowngradeBlockReason = async (
    target: CatalogPlan
  ): Promise<string | null> => {
    try {
      const data = await getPlanLimits();
      const usage = data.usage as { activeUsers: number; activeBranches: number };
      const issues: string[] = [];
      if (
        target.max_branches > 0 &&
        usage.activeBranches > target.max_branches
      ) {
        issues.push(
          `${target.name} allows ${target.max_branches} branch(es); you have ${usage.activeBranches}. Remove extra branches first.`
        );
      }
      if (target.max_users > 0 && usage.activeUsers > target.max_users) {
        issues.push(
          `${target.name} allows ${target.max_users} user(s); you have ${usage.activeUsers}. Remove users first.`
        );
      }
      return issues.length > 0 ? issues.join(" ") : null;
    } catch {
      return null;
    }
  };

  const handleUpgrade = async (plan: CatalogPlan) => {
    if (plan.price === 0) {
      try {
        await createPendingSubscription(plan.id || plan.name);
        await refreshAll();
        alert(`You are now on the ${plan.name} plan.`);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Could not activate the free plan."
        );
      }
      return;
    }

    setSelectedUpgradePlan(plan);
    setUpgradePaymentData({
      email: customerEmail || "",
    });
    setIsUpgradeDialogOpen(true);
  };

  const handlePlanChange = async (planIdOrName: string) => {
    const plan = plans.find(
      (p) => p.id === planIdOrName || p.name === planIdOrName
    );
    if (!plan) return;
    if (plan.current && !isPendingPayment) return;

    if (!isFirstTimeSubscriber && !isExpired && plan.price === currentPlanPrice) {
      alert("You are already on this plan tier.");
      return;
    }

    if (isPlanDowngrade(plan)) {
      const blockReason = await getDowngradeBlockReason(plan);
      if (blockReason) {
        alert(blockReason);
        return;
      }
      setSelectedDowngradePlan(plan);
      setIsDowngradeDialogOpen(true);
      return;
    }

    await handleUpgrade(plan);
  };

  const processUpgradePayment = async () => {
    if (!selectedUpgradePlan) return;
    const plan = selectedUpgradePlan;
    const { email } = upgradePaymentData;

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      alert("Please enter your email.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      alert(INVALID_EMAIL_MESSAGE);
      return;
    }

    setIsUpgradePaymentLoading(true);
    try {
      const subscription = await createPendingSubscription(plan.id || plan.name);

      const polar = await startPolarSubscriptionCheckout({
        planId: plan.id || plan.name,
        subscriptionId: subscription.id,
        customerEmail: normalizedEmail,
        customerName,
        returnContext: checkoutReturnContext,
      });
      setIsUpgradeDialogOpen(false);
      window.location.href = polar.checkoutUrl;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred while processing your upgrade."
      );
    } finally {
      setIsUpgradePaymentLoading(false);
    }
  };

  const confirmScheduleDowngrade = async () => {
    if (!selectedDowngradePlan) return;
    const blockReason = await getDowngradeBlockReason(selectedDowngradePlan);
    if (blockReason) {
      alert(blockReason);
      return;
    }
    setIsSchedulingDowngrade(true);
    try {
      const result = await scheduleDowngradeMutation.mutateAsync(
        selectedDowngradePlan.id || selectedDowngradePlan.name,
      );
      setIsDowngradeDialogOpen(false);
      setSelectedDowngradePlan(null);
      await refreshAll();
      alert(
        `Your ${result.currentPlan.name} plan remains active until ${formatEffectiveDate(result.effectiveAt)}.\nYour plan will change to ${result.scheduledPlan.name} on renewal.`
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Could not schedule downgrade."
      );
    } finally {
      setIsSchedulingDowngrade(false);
    }
  };

  const handleCancelScheduledDowngrade = async () => {
    try {
      await cancelScheduledMutation.mutateAsync();
      setScheduledChange(null);
      alert("Scheduled downgrade canceled.");
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Could not cancel scheduled change."
      );
    }
  };

  const getDowngradeEffectiveDateLabel = (): string | null => {
    if (subscriptionExpiresAt) {
      return formatEffectiveDate(subscriptionExpiresAt);
    }
    if (scheduledChange?.effectiveAt) {
      return formatEffectiveDate(scheduledChange.effectiveAt);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {scheduledChange && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-sm">Scheduled plan change</CardTitle>
            <CardDescription>
              Your current plan stays active until renewal. The change applies
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Current plan</TableHead>
                  <TableHead>Scheduled plan</TableHead>
                  <TableHead>Effective date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {scheduledChange.currentPlan?.name ?? activePlanLabel}
                  </TableCell>
                  <TableCell className="font-medium">
                    {scheduledChange.targetPlan.name}
                  </TableCell>
                  <TableCell>
                    {formatEffectiveDate(scheduledChange.effectiveAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCancelScheduledDowngrade()}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {planLimitsHint && (
              <p className="text-xs text-amber-800 mt-3 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {planLimitsHint}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        {plansQuery.isPending || activePlanLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading your plan and catalog…
          </p>
        ) : activePlanError && !activePlan ? (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-center">
            <p className="text-sm text-destructive">
              Could not load your current plan. Check your connection and try again.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetchActivePlan();
                void plansQuery.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : plans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No plans available. Contact support or try again later.
          </p>
        ) : (
          <div className="space-y-6">
            {pendingPlan && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Awaiting payment
                  </CardTitle>
                  <CardDescription>
                    You selected the {pendingPlan.name} plan during setup. Complete payment to activate it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{pendingPlan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        RWF {pendingPlan.price.toLocaleString()} / month
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedUpgradePlan(pendingPlan);
                        setUpgradePaymentData({
                          email: customerEmail || "",
                        });
                        setIsUpgradeDialogOpen(true);
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <PlanCatalogSections
              currentPlan={isPendingPayment ? null : currentPlan}
              activePlanLabel={activePlanLabel}
              upgradePlans={upgradePlans}
              downgradePlans={downgradePlans}
              layout={layout}
              onPlanSelect={(id) => void handlePlanChange(id)}
              isFirstTime={isFirstTimeSubscriber}
              isExpired={isExpired}
            />
          </div>
        )}
      </div>

      {showBranchAddons && addonPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Branch add-ons
            </CardTitle>
            <CardDescription>
              Extra branch locations billed separately — not a change to your main
              plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {addonPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg p-6 border-dashed"
                >
                  <div className="text-center mb-4">
                    <Badge variant="secondary" className="mb-2">
                      Add-on
                    </Badge>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="text-3xl font-bold text-blue-600">
                      {plan.price.toLocaleString()} RWF
                    </div>
                    <p className="text-sm text-muted-foreground">
                      per month · one branch
                    </p>
                  </div>
                  {plan.monthly_tx_limit > 0 && (
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {plan.monthly_tx_limit.toLocaleString()} transactions / month
                    </p>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => {
                      setAddonPlanTarget(plan);
                      setAddonCheckoutOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add branch with this plan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={isUpgradeDialogOpen}
        onOpenChange={(open) => {
          if (isUpgradePaymentLoading) return;
          setIsUpgradeDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitlePrefix} {selectedUpgradePlan?.name} Plan</DialogTitle>
            <DialogDescription>
              {isUpgradePaymentLoading
                ? "Starting payment — please wait…"
                : dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {selectedUpgradePlan?.price.toLocaleString()} RWF
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={upgradePaymentData.email}
                  disabled={isUpgradePaymentLoading}
                  onChange={(e) =>
                    setUpgradePaymentData({
                      ...upgradePaymentData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUpgradeDialogOpen(false)}
                disabled={isUpgradePaymentLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void processUpgradePayment()}
                disabled={
                  isUpgradePaymentLoading ||
                  !upgradePaymentData.email
                }
                className="flex-1"
              >
                {isUpgradePaymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDowngradeDialogOpen} onOpenChange={setIsDowngradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 text-sm text-muted-foreground">
                {selectedDowngradePlan && (
                  <>
                    <div className="rounded-lg border bg-muted/50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Plan change takes effect on
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        {getDowngradeEffectiveDateLabel() ?? (
                          <span className="text-base font-normal">
                            Loading billing period…
                          </span>
                        )}
                      </p>
                    </div>
                    <p>
                      Your{" "}
                      <span className="font-medium text-foreground">
                        {activePlanLabel}
                      </span>{" "}
                      plan stays active until then, then changes to{" "}
                      <span className="font-medium text-foreground">
                        {selectedDowngradePlan.name}
                      </span>
                      .
                    </p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDowngradeDialogOpen(false)}
              disabled={isSchedulingDowngrade}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void confirmScheduleDowngrade()}
              disabled={isSchedulingDowngrade}
            >
              {isSchedulingDowngrade ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling…
                </>
              ) : (
                "Confirm downgrade"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BranchAddonCheckoutDialog
        open={addonCheckoutOpen}
        onOpenChange={setAddonCheckoutOpen}
        addonPlans={addonPlans.map(toSaasAddonPlan)}
        mode="new_branch"
        initialPlanId={addonPlanTarget?.id}
        customerEmail={customerEmail}
        customerName={customerName}
        onSuccess={() => {
          void refreshAll();
          alert("Branch add-on purchased successfully");
        }}
      />
    </div>
  );
}
