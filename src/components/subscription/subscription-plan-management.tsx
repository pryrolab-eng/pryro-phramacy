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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { normalizePlanKey, planDisplayName } from "@/lib/admin/plan-stats";
import { fallbackPlansForDisplay } from "@/lib/subscription/default-plans";
import { normalizeSubscriptionPlanRow } from "@/lib/subscription/normalize-plan";
import {
  createPendingSubscription,
  pollKpayTransaction,
  startKpaySubscriptionCheckout,
  startPolarSubscriptionCheckout,
  type PaidCheckoutContext,
  type ScheduledChangeResponse,
} from "@/lib/subscription/checkout-client";
import { getPlanLimits } from "@/lib/http/subscription";
import {
  useCancelScheduledChangeMutation,
  useInvalidateSubscriptionManagement,
  usePharmacySubscriptionPlan,
  usePlanLimitsQuery,
  usePolarConfigEnabled,
  useScheduleDowngradeMutation,
  useScheduledChangeQuery,
  useSubscriptionPlansCatalog,
  useSubscriptionStatusQuery,
  useValidatePhoneMutation,
} from "@/hooks/useSubscriptionManagement";
import { BranchAddonCheckoutDialog } from "@/components/subscription/branch-addon-checkout-dialog";
import { PlanFeatureList } from "@/components/subscription/plan-feature-list";
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
  customerPhone?: string;
  checkoutReturnContext?: PaidCheckoutContext;
  onPlanChanged?: () => void;
  showBranchAddons?: boolean;
};

function planMatchesCurrent(planName: string, activePlanKey: string): boolean {
  return normalizePlanKey(planName) === normalizePlanKey(activePlanKey);
}

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
  customerPhone = "",
  checkoutReturnContext = "settings",
  onPlanChanged,
  showBranchAddons = true,
}: Props) {
  const [currentPlanKey, setCurrentPlanKey] = useState("standard");
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
  const pharmacyPlanQuery = usePharmacySubscriptionPlan();
  const scheduledQuery = useScheduledChangeQuery();
  const statusQuery = useSubscriptionStatusQuery();
  const limitsQuery = usePlanLimitsQuery();
  const polarEnabled = usePolarConfigEnabled().data ?? false;
  const validatePhoneMutation = useValidatePhoneMutation();
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
    paymentMethod: "kpay",
    phone: "",
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
        current: planMatchesCurrent(plan.name, currentPlanKey),
        features: plan.features,
        plan_type: plan.plan_type,
        monthly_tx_limit: plan.monthly_tx_limit,
        max_users: Number(row.max_users ?? 0),
        max_branches: Number(row.max_branches ?? 0),
      };
    },
    [currentPlanKey]
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
    if (pharmacyPlanQuery.data) {
      setCurrentPlanKey(pharmacyPlanQuery.data.subscription);
      if (pharmacyPlanQuery.data.subscriptionExpiresAt) {
        setSubscriptionExpiresAt(pharmacyPlanQuery.data.subscriptionExpiresAt);
      }
    }
  }, [pharmacyPlanQuery.data]);

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
        current: planMatchesCurrent(plan.name, currentPlanKey),
        features: plan.features,
        plan_type: "main" as const,
        monthly_tx_limit: plan.monthly_tx_limit ?? 0,
        max_users: 0,
        max_branches: 0,
      }));
      setPlans(fallback);
      setAddonPlans([]);
    }
  }, [plansQuery.data, plansQuery.isError, plansQuery.isSuccess, applyCatalogPlans, currentPlanKey]);

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
        current: planMatchesCurrent(plan.name, currentPlanKey),
      }))
    );
  }, [currentPlanKey]);

  const activePlanLabel = useMemo(() => {
    const match = plans.find((p) => p.current);
    return match?.name ?? planDisplayName(currentPlanKey);
  }, [plans, currentPlanKey]);

  const currentPlanPrice = () => {
    const current = plans.find((p) => p.current);
    return current?.price ?? 0;
  };

  const isPlanUpgrade = (plan: CatalogPlan) => plan.price > currentPlanPrice();
  const isPlanDowngrade = (plan: CatalogPlan) => plan.price < currentPlanPrice();

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
        setCurrentPlanKey(normalizePlanKey(plan.name));
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
      paymentMethod: "kpay",
      phone: customerPhone || "",
      email: customerEmail || "",
    });
    setIsUpgradeDialogOpen(true);
  };

  const handlePlanChange = async (planIdOrName: string) => {
    const plan = plans.find(
      (p) => p.id === planIdOrName || p.name === planIdOrName
    );
    if (!plan || plan.current) return;

    if (plan.price === currentPlanPrice()) {
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
    const { paymentMethod, phone, email } = upgradePaymentData;

    if (!email) {
      alert("Please enter your email.");
      return;
    }
    if (paymentMethod === "kpay" && !phone) {
      alert("Please enter your Mobile Money number.");
      return;
    }

    setIsUpgradePaymentLoading(true);
    try {
      const subscription = await createPendingSubscription(plan.id || plan.name);

      if (paymentMethod === "polar") {
        const polar = await startPolarSubscriptionCheckout({
          planId: plan.id || plan.name,
          subscriptionId: subscription.id,
          customerEmail: email,
          customerName,
          customerPhone: phone,
          returnContext: checkoutReturnContext,
        });
        setIsUpgradeDialogOpen(false);
        window.location.href = polar.checkoutUrl;
        return;
      }

      const phoneResult = await validatePhoneMutation.mutateAsync(phone);

      if (!phoneResult.phone?.isValid || !phoneResult.phone.formatted) {
        alert("Please enter a valid Rwanda phone number (e.g. 0788123456)");
        return;
      }

      const paymentData = await startKpaySubscriptionCheckout({
        plan,
        subscriptionId: subscription.id,
        customerName,
        customerPhone: phoneResult.phone.formatted,
        customerEmail: email,
        bankId: phoneResult.phone.kpayBankId,
      });

      setIsUpgradeDialogOpen(false);

      if (paymentData.success && paymentData.transaction?.checkoutUrl) {
        window.location.href = paymentData.transaction.checkoutUrl;
        return;
      }

      if (paymentData.success && paymentData.transaction?.id) {
        alert(
          `Payment initiated! Check your phone (${phoneResult.phone.formatted}) for the prompt.`
        );
        pollKpayTransaction(
          paymentData.transaction.id,
          async () => {
            setCurrentPlanKey(normalizePlanKey(plan.name));
            await refreshAll();
            alert(`Payment successful! You are now on the ${plan.name} plan.`);
          },
          (msg) => alert(msg)
        );
      } else {
        alert(
          paymentData.kpayResponse?.statusdesc ||
            "Payment failed. Please try again."
        );
      }
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Main subscription plans</CardTitle>
          <CardDescription>
            Upgrade or schedule a downgrade for your pharmacy&apos;s primary plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No plans available. Contact support or try again later.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id || plan.name}
                  className={`border rounded-lg p-5 flex flex-col ${plan.current ? "border-blue-500 bg-blue-50" : ""}`}
                >
                  <div className="text-center mb-3">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {plan.price.toLocaleString()} RWF
                    </div>
                    <p className="text-sm text-muted-foreground">per month</p>
                  </div>
                  <PlanFeatureList
                    features={plan.features}
                    maxVisible={5}
                    dense
                    className="mb-4 flex-1"
                  />
                  {plan.current ? (
                    <Button disabled className="w-full">
                      <Check className="mr-2 h-4 w-4" />
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void handlePlanChange(plan.id || plan.name)}
                      variant={isPlanUpgrade(plan) ? "default" : "outline"}
                      className="w-full"
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      {isPlanUpgrade(plan) ? "Upgrade" : "Downgrade"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            <DialogTitle>Upgrade to {selectedUpgradePlan?.name} Plan</DialogTitle>
            <DialogDescription>
              {isUpgradePaymentLoading
                ? "Starting payment — please wait…"
                : "Complete payment to upgrade your subscription"}
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
                <Label>Payment Method</Label>
                <Select
                  value={upgradePaymentData.paymentMethod}
                  onValueChange={(value) =>
                    setUpgradePaymentData({
                      ...upgradePaymentData,
                      paymentMethod: value,
                    })
                  }
                  disabled={isUpgradePaymentLoading}
                >
                  <SelectTrigger disabled={isUpgradePaymentLoading}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kpay">Mobile Money — KPay (Rwanda)</SelectItem>
                    {polarEnabled ? (
                      <SelectItem value="polar">Card / international — Polar</SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
              {upgradePaymentData.paymentMethod === "kpay" ? (
                <div className="grid gap-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="0788123456"
                    value={upgradePaymentData.phone}
                    disabled={isUpgradePaymentLoading}
                    onChange={(e) =>
                      setUpgradePaymentData({
                        ...upgradePaymentData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
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
                  !upgradePaymentData.email ||
                  (upgradePaymentData.paymentMethod === "kpay" &&
                    !upgradePaymentData.phone)
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
        customerPhone={customerPhone}
        customerName={customerName}
        onSuccess={() => {
          void refreshAll();
          alert("Branch add-on purchased successfully");
        }}
      />
    </div>
  );
}
