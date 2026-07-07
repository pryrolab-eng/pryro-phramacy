"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/http/client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  FileSpreadsheet,
  Loader2,
  Lock,
  Mail,
  Plus,
  Shield,
  Users,
  X,
} from "lucide-react";
import {
  OnboardingShell,
  OnboardingStepNav,
} from "@/components/onboarding/onboarding-shell";
import { PharmacyBrandPreview } from "@/components/onboarding/pharmacy-brand-preview";
import { PlanFeatureList } from "@/components/subscription/plan-feature-list";
import type { OnboardingStepId } from "@/components/onboarding/onboarding-stepper";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { createPharmacist } from "@/lib/http/pharmacist";
import {
  useOnboardingPlans,
  useOnboardingStatus,
  useSubmitOnboardingPharmacyMutation,
  useUpgradeSubscriptionMutation,
} from "@/hooks/useOnboarding";
import {
  matchPlanByIntent,
} from "@/lib/onboarding/intent";
import {
  captureIntentFromPlanSelection,
  clearOnboardingIntent,
  readOnboardingIntent,
} from "@/lib/onboarding/intent-client";
import {
  createPendingSubscription,
  startPolarSubscriptionCheckout,
} from "@/lib/subscription/checkout-client";
import {
  INVALID_EMAIL_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/validation/email";

type PlanRow = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[] | null;
  is_popular?: boolean | null;
};

type PharmacySnapshot = {
  id?: string;
  name?: string;
  license_number?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

type TeamInviteRow = {
  id: string;
  email: string;
  role: string;
};

const ONBOARDING_STEP_KEY = "pryrox_onboarding_step";

function onboardingDoneKey(pharmacyId: string) {
  return `pryrox_onboarding_done_${pharmacyId}`;
}

function newInviteRow(): TeamInviteRow {
  return { id: crypto.randomUUID(), email: "", role: "" };
}

function displayPrice(plan: PlanRow, annual: boolean) {
  const monthly = Number(plan.price);
  if (!annual || monthly === 0) return monthly;
  return Math.round(monthly * 12 * 0.8);
}

function periodLabel(plan: PlanRow, annual: boolean) {
  if (Number(plan.price) === 0) return plan.period;
  return annual ? "per year (billed annually)" : "per month";
}

export default function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<OnboardingStepId>(1);
  const [initializing, setInitializing] = useState(true);
  const [pharmacySaved, setPharmacySaved] = useState(false);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);

  const [pharmacy, setPharmacy] = useState({
    name: "",
    license_number: "",
    city: "Kigali",
    address: "",
    phone: "",
    email: "",
  });

  const [plansError, setPlansError] = useState<string | null>(null);
  const plansQuery = useOnboardingPlans({
    enabled: step >= 2 && step <= 3 && !initializing,
  });
  const plans = (plansQuery.data ?? []) as PlanRow[];
  const plansLoading = plansQuery.isPending || plansQuery.isFetching;
  const submitPharmacyMutation = useSubmitOnboardingPharmacyMutation();
  const upgradeSubscriptionMutation = useUpgradeSubscriptionMutation();
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null);
  const [paymentEmail, setPaymentEmail] = useState("");

  const [invites, setInvites] = useState<TeamInviteRow[]>([
    newInviteRow(),
    newInviteRow(),
  ]);

  const applyPlanIntent = useCallback((list: PlanRow[]) => {
    const intent = readOnboardingIntent();
    if (!intent) return;

    const match = matchPlanByIntent(list, intent);
    if (match) {
      setSelectedPlan(match);
      setBillingAnnual(intent.billing === "annual");
    }
  }, []);

  const goToStep = useCallback((next: OnboardingStepId) => {
    setStep(next);
    sessionStorage.setItem(ONBOARDING_STEP_KEY, String(next));
  }, []);

  const markWizardComplete = useCallback(
    (id: string | null) => {
      if (id) {
        localStorage.setItem(onboardingDoneKey(id), "1");
      }
      sessionStorage.removeItem(ONBOARDING_STEP_KEY);
    },
    [],
  );

  const finishOnboarding = useCallback(() => {
    markWizardComplete(pharmacyId);
    clearOnboardingIntent();
    router.push("/app");
    router.refresh();
  }, [markWizardComplete, pharmacyId, router]);

  const selectPlan = (plan: PlanRow) => {
    setSelectedPlan(plan);
    captureIntentFromPlanSelection({
      planId: plan.id,
      planName: plan.name,
      billing: billingAnnual ? "annual" : "monthly",
    });
  };

  const setBilling = (annual: boolean) => {
    setBillingAnnual(annual);
    if (selectedPlan) {
      captureIntentFromPlanSelection({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        billing: annual ? "annual" : "monthly",
      });
    }
  };

  useEffect(() => {
    if (plansQuery.isError) {
      setPlansError(
        plansQuery.error instanceof Error
          ? plansQuery.error.message
          : "Could not load plans.",
      );
      return;
    }
    if (plansQuery.isSuccess) {
      setPlansError(null);
      if (plans.length === 0) {
        setPlansError("No subscription plans are available. Please try again.");
      } else {
        applyPlanIntent(plans);
      }
    }
  }, [plansQuery.isError, plansQuery.isSuccess, plansQuery.error, plans, applyPlanIntent]);

  const statusQuery = useOnboardingStatus();
  const resumeRan = useRef(false);

  useEffect(() => {
    if (statusQuery.isPending || resumeRan.current) return;
    resumeRan.current = true;

    const resume = async () => {
      try {
        const queryStep = searchParams.get("step");
        const celebrateStep =
          queryStep === "4" ? (4 as OnboardingStepId) : null;

        if (statusQuery.isError) {
          if (
            statusQuery.error instanceof ApiError &&
            statusQuery.error.status === 401
          ) {
            router.replace("/sign-in");
            return;
          }
          toast.error(
            "We couldn't load your setup progress. Try refreshing, or continue by filling in your pharmacy profile below.",
          );
          setStep(1);
          setInitializing(false);
          return;
        }

        const data = statusQuery.data;
        if (!data) {
          setStep(1);
          setInitializing(false);
          return;
        }

        if (data.isPlatformAdmin || data.redirect === "/admin") {
          router.replace("/admin");
          return;
        }

        const ph = data.pharmacy as PharmacySnapshot | null;
        if (ph?.id) setPharmacyId(ph.id);
        if (ph?.name) {
          setPharmacy({
            name: ph.name ?? "",
            license_number: ph.license_number ?? "",
            city: ph.city ?? "Kigali",
            address: ph.address ?? "",
            phone: ph.phone ?? "",
            email: ph.email ?? "",
          });
          setPharmacySaved(true);
        }

        if (ph?.id && localStorage.getItem(onboardingDoneKey(ph.id)) === "1") {
          router.replace("/app");
          return;
        }

        if (data.subscriptionActive && ph?.id) {
          let resumeStep: OnboardingStepId = celebrateStep ?? 4;
          const stored = sessionStorage.getItem(ONBOARDING_STEP_KEY);
          if (stored === "5") resumeStep = 5;
          setStep(resumeStep);
          sessionStorage.setItem(ONBOARDING_STEP_KEY, String(resumeStep));
          setInitializing(false);
          return;
        }

        if (data.redirect === "/app" || data.completed) {
          router.replace("/app");
          return;
        }

        let resumeStep = (data.step as OnboardingStepId) ?? 1;
        if (celebrateStep) resumeStep = celebrateStep;

        const storedStep = sessionStorage.getItem(ONBOARDING_STEP_KEY);
        if (ph?.name && storedStep === "3" && resumeStep === 2) {
          resumeStep = 3;
        }
        if (storedStep === "4" || storedStep === "5") {
          resumeStep = Number(storedStep) as OnboardingStepId;
        }

        if (data.pendingPlan) {
          setSelectedPlan(data.pendingPlan as PlanRow);
          resumeStep = 3;
        }

        setStep(resumeStep);
        sessionStorage.setItem(ONBOARDING_STEP_KEY, String(resumeStep));

        if (resumeStep >= 2) {
          try {
            await plansQuery.refetch();
          } catch {
            toast.error("Could not load plans. You can retry on the plan step.");
          }
        }

        if (ph?.email) {
          setPaymentEmail(ph.email ?? "");
        }
      } catch {
        setStep(1);
        toast.info(
          "Set up your pharmacy profile below to get started. Platform administrators should sign in and open the admin dashboard.",
        );
      } finally {
        setInitializing(false);
      }
    };

    void resume();
  }, [plansQuery, router, searchParams, statusQuery.data, statusQuery.error, statusQuery.isError, statusQuery.isPending]);

  useEffect(() => {
    if (plans.length > 0) applyPlanIntent(plans);
  }, [plans, applyPlanIntent]);

  const submitPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
        setLoading(true);
    try {
      const data = await submitPharmacyMutation.mutateAsync(pharmacy);
      if (data.error) {
        toast.error(data.error || "Could not save pharmacy.");
        return;
      }
      if (data.pharmacyId) setPharmacyId(data.pharmacyId);
      setPharmacySaved(true);
      goToStep(2);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const continueToCheckout = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan.");
      return;
    }
    setPaymentEmail((prev) => prev || pharmacy.email);
    goToStep(3);
  };

  const completeFreePlan = async () => {
    if (!selectedPlan) return;
        setLoading(true);
    try {
      const data = await upgradeSubscriptionMutation.mutateAsync(
        selectedPlan.name,
      );
      if (data.error) {
        toast.error(data.error || "Could not activate plan.");
        return;
      }
      goToStep(4);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const payForPlan = async () => {
    if (!selectedPlan) return;
    const email = normalizeEmail(paymentEmail);
    if (!email) {
      toast.error("Enter an email for your receipt.");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error(INVALID_EMAIL_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      const subscription = await createPendingSubscription(
        selectedPlan.id || selectedPlan.name,
      );

      const polar = await startPolarSubscriptionCheckout({
        planId: selectedPlan.id || selectedPlan.name,
        subscriptionId: subscription.id,
        customerEmail: email,
        customerName: pharmacy.name || "Pharmacy owner",
        returnContext: "onboarding",
      });
      sessionStorage.setItem("pryrox_payment_return", "onboarding");
      window.location.href = polar.checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const submitInvites = async () => {
    const rows = invites.filter((r) => r.email.trim());
    if (rows.length === 0) {
      finishOnboarding();
      return;
    }
    if (!pharmacyId) {
      toast.error("Pharmacy not found. Continue to the dashboard.");
      return;
    }

    setLoading(true);
    const created: string[] = [];
    const emailFailed: string[] = [];
    const failures: string[] = [];

    for (const row of rows) {
      if (!row.role) {
        failures.push(`${row.email}: select a role`);
        continue;
      }
      const local = row.email.split("@")[0] || "Team member";
      try {
        const result = await createPharmacist({
          pharmacy_id: pharmacyId,
          email: row.email.trim(),
          full_name: local.replace(/[._]/g, " "),
          phone: pharmacy.phone || "0780000000",
          role: row.role,
          pharmacy_name: pharmacy.name || "Your pharmacy",
        });
        if (result.emailSent) {
          created.push(row.email.trim());
        } else {
          emailFailed.push(
            `${row.email}: account created but email not sent${result.emailError ? ` (${result.emailError})` : ""}`,
          );
        }
      } catch (err) {
        failures.push(
          `${row.email}: ${err instanceof Error ? err.message : "failed"}`,
        );
      }
    }

    setLoading(false);

    if (failures.length > 0) {
      toast.error("Some invites could not be created", {
        description: failures.join("\n"),
      });
      if (created.length === 0 && emailFailed.length === 0) return;
    }

    if (emailFailed.length > 0) {
      toast.warning("Invites created — email not sent", {
        description: emailFailed.join("\n"),
        duration: 10000,
      });
    }

    if (created.length > 0) {
      toast.success(
        created.length === 1 ? "Invitation sent" : "Invitations sent",
        {
          description:
            created.length === 1
              ? `We emailed login instructions to ${created[0]}.`
              : `We emailed login instructions to ${created.length} team members.`,
        },
      );
    }

    finishOnboarding();
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
        <p className="text-sm text-neutral-500">Loading your progress…</p>
      </div>
    );
  }

  return (
    <OnboardingShell
      step={step}
      showSkip={step === 5}
      onSkip={finishOnboarding}
      skipLabel="Skip for now"
    >
      {step === 1 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Pharmacy profile
            </h1>
            <p className="max-w-xl text-sm text-neutral-500">
              Tell us about your pharmacy to personalize your dashboard
              experience. This profile is required for pharmacy owners and
              staff.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600">
              <Shield className="h-3.5 w-3.5" />
              Secure setup for regulated healthcare data
            </div>
          </div>

          <form onSubmit={submitPharmacy}>
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="ph-name">Pharmacy name</Label>
                  <Input
                    id="ph-name"
                    required
                    className="border-neutral-200"
                    value={pharmacy.name}
                    onChange={(e) =>
                      setPharmacy((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Apex Pharmacy"
                  />
                  <p className="text-xs text-neutral-500">
                    Shown on invoices and patient-facing records.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-license" className="flex items-baseline gap-1.5">
                    Registration number
                    <span className="text-xs font-normal text-neutral-400">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="ph-license"
                    className="border-neutral-200"
                    value={pharmacy.license_number}
                    onChange={(e) =>
                      setPharmacy((p) => ({
                        ...p,
                        license_number: e.target.value,
                      }))
                    }
                    placeholder="PH-2024-XXXX"
                  />
                  <p className="text-xs text-neutral-500">
                    Official license number from the Ministry of Health.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-city">City</Label>
                  <Input
                    id="ph-city"
                    required
                    className="border-neutral-200"
                    value={pharmacy.city}
                    onChange={(e) =>
                      setPharmacy((p) => ({ ...p, city: e.target.value }))
                    }
                    placeholder="e.g. Kigali"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-address" className="flex items-baseline gap-1.5">
                    Address
                    <span className="text-xs font-normal text-neutral-400">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="ph-address"
                    className="min-h-[88px] border-neutral-200"
                    value={pharmacy.address}
                    onChange={(e) =>
                      setPharmacy((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="KN 3 Rd, Kigali, Rwanda"
                  />
                  <p className="text-xs text-neutral-500">
                    Physical location of your main branch.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-phone">Primary phone</Label>
                  <Input
                    id="ph-phone"
                    required
                    type="tel"
                    className="border-neutral-200"
                    value={pharmacy.phone}
                    onChange={(e) =>
                      setPharmacy((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-email" className="flex items-baseline gap-1.5">
                    Business email
                    <span className="text-xs font-normal text-neutral-400">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="ph-email"
                    type="email"
                    className="border-neutral-200"
                    value={pharmacy.email}
                    onChange={(e) =>
                      setPharmacy((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="contact@yourpharmacy.rw"
                  />
                </div>
              </div>

              <PharmacyBrandPreview
                name={pharmacy.name}
                city={pharmacy.city}
                address={pharmacy.address}
                phone={pharmacy.phone}
                email={pharmacy.email}
                licenseNumber={pharmacy.license_number}
                className="lg:pt-8"
              />
            </div>

            <OnboardingStepNav
              primaryType="submit"
              primaryLabel={pharmacySaved ? "Continue" : "Continue"}
              onPrimary={() => {}}
              primaryLoading={loading}
              primaryDisabled={loading}
            />
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Select your Pryrox plan
            </h1>
            <p className="mx-auto max-w-lg text-sm text-neutral-500">
              Choose the right level of operational power for your pharmacy.
              Upgrade or downgrade at any time.
            </p>
            <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1 text-sm">
              <button
                type="button"
                onClick={() => setBilling(false)}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  !billingAnnual
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling(true)}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  billingAnnual
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600"
                }`}
              >
                Annually
                <span className="ml-1 text-xs opacity-80">−20%</span>
              </button>
            </div>
          </div>

          {plansLoading ? (
            <div className="flex flex-col items-center gap-2 py-16 text-sm text-neutral-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading plans…
            </div>
          ) : plansError ? (
            <div className="space-y-3 py-12 text-center">
              <p className="text-sm text-neutral-700">{plansError}</p>
              <button
                type="button"
                onClick={() => void plansQuery.refetch()}
                className="text-sm underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const selected = selectedPlan?.id === plan.id;
                const popular = Boolean(plan.is_popular);
                const price = displayPrice(plan, billingAnnual);

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => selectPlan(plan)}
                    className={`relative flex flex-col rounded-xl border bg-white p-6 text-left transition-all ${
                      selected || popular
                        ? "border-neutral-900 shadow-md"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {popular ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-neutral-900 bg-white px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        Recommended
                      </span>
                    ) : null}
                    <p className="font-semibold text-neutral-900">{plan.name}</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900">
                      {price.toLocaleString()}
                      <span className="ml-1 text-sm font-normal text-neutral-500">
                        RWF
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {periodLabel(plan, billingAnnual)}
                    </p>
                    <div className="mt-4 flex-1">
                      <PlanFeatureList
                        features={plan.features || []}
                        maxVisible={4}
                        dense
                      />
                    </div>
                    <span
                      className={`mt-6 block rounded-md py-2.5 text-center text-sm font-medium ${
                        selected || popular
                          ? "bg-neutral-900 text-white"
                          : "border border-neutral-300 text-neutral-900"
                      }`}
                    >
                      Select {plan.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Lock className="h-3.5 w-3.5" />
            Secure payment via card. Cancel anytime.
          </p>

          <OnboardingStepNav
            onBack={() => goToStep(1)}
            primaryLabel="Continue"
            onPrimary={continueToCheckout}
            primaryDisabled={!selectedPlan || plansLoading}
          />
        </div>
      )}

      {step === 3 && selectedPlan && (
        <div className="mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-semibold text-neutral-900">Checkout</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {selectedPlan.price === 0
              ? "Start on this plan at no charge. You can upgrade anytime."
              : "Complete payment to activate your subscription."}
          </p>

          <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <p className="font-medium text-neutral-900">{selectedPlan.name}</p>
            <p className="text-neutral-500">
              {Number(selectedPlan.price).toLocaleString()} RWF —{" "}
              {selectedPlan.period}
            </p>
          </div>

          {selectedPlan.price === 0 ? null : (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pay-email">Email for receipt</Label>
                <Input
                  id="pay-email"
                  type="email"
                  autoComplete="email"
                  className="border-neutral-200"
                  value={paymentEmail}
                  onChange={(e) => setPaymentEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
          )}

          <OnboardingStepNav
            onBack={() => goToStep(2)}
            primaryLabel={
              selectedPlan.price === 0
                ? "Start with this plan"
                : "Pay with card"
            }
            onPrimary={() => {
              if (selectedPlan.price === 0) void completeFreePlan();
              else void payForPlan();
            }}
            primaryLoading={loading}
            primaryDisabled={loading}
          />
        </div>
      )}

      {step === 4 && (
        <div className="mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-neutral-900">
            <Check className="h-8 w-8 text-neutral-900" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            You&apos;re live
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            {pharmacy.name || "Your pharmacy"} is set up on Pryrox. You can
            invite your team next, or go straight to the dashboard.
          </p>
          <ul className="mt-8 space-y-3 text-left text-sm text-neutral-700">
            {[
              "Pharmacy profile saved",
              selectedPlan
                ? `${selectedPlan.name} plan ready`
                : "Subscription active",
              "Dashboard and POS available",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check className="h-4 w-4 shrink-0 text-neutral-900" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left">
            <p className="text-sm font-medium text-neutral-900">
              Bring your existing data
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Download Pryrox Excel templates and import products, customers,
              insurance coverage, and staff in bulk.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href={PHARMACY_ROUTES.importData}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Open import center
              </Link>
              <Link
                href={`${PHARMACY_ROUTES.inventory}?import=1`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
              >
                Import inventory now
              </Link>
            </div>
          </div>
          <OnboardingStepNav
            onBack={() => goToStep(3)}
            primaryLabel="Invite team"
            onPrimary={() => goToStep(5)}
          />
          <button
            type="button"
            onClick={finishOnboarding}
            className="mt-4 w-full text-sm text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
          >
            Go to dashboard now
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="mx-auto max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
              <Users className="h-6 w-6 text-neutral-700" />
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Invite team
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Add your team by email. Each person receives login instructions in
              their inbox — no passwords to copy manually.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_140px_32px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              <span>Email address</span>
              <span>Role</span>
              <span />
            </div>
            {invites.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_140px_32px] items-center gap-2"
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    type="email"
                    className="border-neutral-200 pl-9"
                    placeholder="name@example.com"
                    value={row.email}
                    onChange={(e) =>
                      setInvites((list) =>
                        list.map((r) =>
                          r.id === row.id
                            ? { ...r, email: e.target.value }
                            : r,
                        ),
                      )
                    }
                  />
                </div>
                <Select
                  value={row.role || undefined}
                  onValueChange={(v) =>
                    setInvites((list) =>
                      list.map((r) =>
                        r.id === row.id ? { ...r, role: v } : r,
                      ),
                    )
                  }
                >
                  <SelectTrigger className="border-neutral-200">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  aria-label="Remove row"
                  onClick={() =>
                    setInvites((list) =>
                      list.length > 1
                        ? list.filter((r) => r.id !== row.id)
                        : list,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setInvites((list) => [...list, newInviteRow()])
              }
              className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
            >
              <Plus className="h-4 w-4" />
              Add another team member
            </button>
          </div>

          <OnboardingStepNav
            onBack={() => goToStep(4)}
            primaryLabel="Finish setup"
            onPrimary={() => void submitInvites()}
            primaryLoading={loading}
            primaryDisabled={loading}
          />
        </div>
      )}

      <p className="mt-8 text-center text-xs text-neutral-500">
        Wrong account?{" "}
        <Link
          href="/sign-in"
          className="underline underline-offset-2 hover:text-neutral-900"
        >
          Back to sign in
        </Link>
      </p>
    </OnboardingShell>
  );
}
