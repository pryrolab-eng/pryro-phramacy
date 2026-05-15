"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, Loader2 } from "lucide-react";

type PlanRow = {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[] | null;
  is_popular?: boolean | null;
};

const STEPS = [
  { id: 1, title: "Pharmacy", description: "Your business details" },
  { id: 2, title: "Plan", description: "Choose a subscription" },
  { id: 3, title: "Checkout", description: "Pay or start free" },
] as const;

type OnboardingStep = 1 | 2 | 3;

type PharmacySnapshot = {
  id?: string;
  name?: string;
  license_number?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

const ONBOARDING_STEP_KEY = "pryrox_onboarding_step";

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [initializing, setInitializing] = useState(true);
  const [pharmacySaved, setPharmacySaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pharmacy, setPharmacy] = useState({
    name: "",
    license_number: "",
    city: "Kigali",
    address: "",
    phone: "",
    email: "",
  });

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentEmail, setPaymentEmail] = useState("");

  const progress = step === 1 ? 15 : step === 2 ? 50 : 100;

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const res = await fetch("/api/plans", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Failed to load plans"
        );
      }
      const list = Array.isArray(data) ? (data as PlanRow[]) : [];
      if (list.length === 0) {
        throw new Error("No subscription plans are available. Please try again.");
      }
      setPlans(list);
    } catch (err) {
      setPlans([]);
      setPlansError(
        err instanceof Error ? err.message : "Could not load plans."
      );
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    const resume = async () => {
      try {
        const res = await fetch("/api/onboarding/status", {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load your progress.");
          return;
        }

        if (data.redirect === "/dashboard" || data.completed) {
          router.replace("/dashboard");
          return;
        }

        const ph = data.pharmacy as PharmacySnapshot | null;
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

        let resumeStep = (data.step as OnboardingStep) ?? 1;

        const storedStep = sessionStorage.getItem(ONBOARDING_STEP_KEY);
        if (ph?.name && storedStep === "3" && resumeStep === 2) {
          resumeStep = 3;
        }

        if (data.pendingPlan) {
          setSelectedPlan(data.pendingPlan as PlanRow);
          resumeStep = 3;
        }

        setStep(resumeStep);
        sessionStorage.setItem(ONBOARDING_STEP_KEY, String(resumeStep));

        if (resumeStep >= 2) {
          await loadPlans();
        }

        if (ph?.email || ph?.phone) {
          setPaymentEmail(ph.email ?? "");
          setPaymentPhone(ph.phone ?? "");
        }
      } catch {
        setError("Could not load your progress. Please refresh the page.");
      } finally {
        setInitializing(false);
      }
    };

    void resume();
  }, [loadPlans, router]);

  useEffect(() => {
    if (step >= 2 && plans.length === 0 && !initializing) {
      void loadPlans();
    }
  }, [step, plans.length, loadPlans, initializing]);

  const goToStep = (next: OnboardingStep) => {
    setStep(next);
    sessionStorage.setItem(ONBOARDING_STEP_KEY, String(next));
  };

  const finishOnboarding = () => {
    sessionStorage.removeItem(ONBOARDING_STEP_KEY);
    router.push("/dashboard");
    router.refresh();
  };

  const submitPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/pharmacy", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pharmacy),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save pharmacy.");
        return;
      }
      setPharmacySaved(true);
      goToStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueToCheckout = () => {
    setError(null);
    if (!selectedPlan) {
      setError("Please select a plan.");
      return;
    }
    setPaymentEmail((prev) => prev || pharmacy.email);
    setPaymentPhone((prev) => prev || pharmacy.phone);
    goToStep(3);
  };

  const completeFreePlan = async () => {
    if (!selectedPlan) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not activate plan.");
        return;
      }
      finishOnboarding();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const payWithMobileMoney = async () => {
    if (!selectedPlan) return;
    if (!paymentPhone.trim() || !paymentEmail.trim()) {
      setError("Enter phone and email for payment.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const phoneValidation = await fetch("/api/test-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: paymentPhone }),
      });
      const phoneResult = await phoneValidation.json();
      if (!phoneResult.phone?.isValid) {
        setError("Enter a valid Rwanda phone number (e.g. 0788123456).");
        return;
      }

      const subResponse = await fetch("/api/subscriptions/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.name }),
      });
      const subData = await subResponse.json();
      if (!subResponse.ok) {
        setError(subData.error || "Could not create subscription.");
        return;
      }

      const paymentResponse = await fetch("/api/kpay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPlan.price,
          subscriptionId: subData.subscription?.id,
          paymentMethod: "momo",
          bankId: phoneResult.phone.kpayBankId || "63510",
          customerName: pharmacy.name || "Pharmacy owner",
          customerPhone: phoneResult.phone.formatted,
          customerEmail: paymentEmail,
          details: `${selectedPlan.name} — subscription`,
        }),
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        setError(paymentData.error || "Payment could not be started.");
        return;
      }

      if (paymentData.success && paymentData.transaction?.checkoutUrl) {
        sessionStorage.setItem("pryrox_payment_return", "onboarding");
        window.location.href = paymentData.transaction.checkoutUrl;
        return;
      }

      if (paymentData.success) {
        let pollCount = 0;
        const maxPolls = 60;
        const interval = setInterval(async () => {
          pollCount++;
          try {
            const statusResponse = await fetch(
              `/api/kpay/status?transactionId=${paymentData.transaction?.id}`
            );
            const statusData = await statusResponse.json();
            if (statusData.transaction?.status === "completed") {
              clearInterval(interval);
              sessionStorage.removeItem(ONBOARDING_STEP_KEY);
              router.push("/dashboard");
              router.refresh();
            } else if (
              statusData.transaction?.status === "failed" ||
              pollCount >= maxPolls
            ) {
              clearInterval(interval);
              setError(
                pollCount >= maxPolls
                  ? "Payment is taking longer than expected. Check again from Settings."
                  : "Payment failed. You can retry from Settings."
              );
            }
          } catch {
            if (pollCount >= maxPolls) clearInterval(interval);
          }
        }, 5000);
      } else {
        setError(
          paymentData.kpayResponse?.statusdesc || "Payment could not be started."
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your progress…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Set up your pharmacy
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            A few quick steps to create your tenant, pick a plan, and start
            using Pryrox.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            {STEPS.map((s) => {
              const done = s.id < step || (s.id === 1 && pharmacySaved);
              return (
                <span
                  key={s.id}
                  className={
                    step === s.id
                      ? "text-primary font-medium"
                      : done
                        ? "text-primary/70"
                        : undefined
                  }
                >
                  {done ? "✓ " : ""}
                  {s.id}. {s.title}
                </span>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 1 && pharmacySaved && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            Your pharmacy is already saved. Continue to choose a plan, or
            update details below and save again.
          </div>
        )}

        {step === 1 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Pharmacy details</CardTitle>
              <CardDescription>
                This is how your business appears in Pryrox. You can edit
                this later in Settings.
              </CardDescription>
            </CardHeader>
            <form onSubmit={submitPharmacy}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ph-name">Pharmacy name</Label>
                  <Input
                    id="ph-name"
                    required
                    value={pharmacy.name}
                    onChange={(e) =>
                      setPharmacy((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. City Pharmacy Kigali"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-license">License number (optional)</Label>
                  <Input
                    id="ph-license"
                    value={pharmacy.license_number}
                    onChange={(e) =>
                      setPharmacy((p) => ({
                        ...p,
                        license_number: e.target.value,
                      }))
                    }
                    placeholder="Official license if you have one"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ph-city">City</Label>
                    <Input
                      id="ph-city"
                      required
                      value={pharmacy.city}
                      onChange={(e) =>
                        setPharmacy((p) => ({ ...p, city: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ph-phone">Phone</Label>
                    <Input
                      id="ph-phone"
                      required
                      type="tel"
                      value={pharmacy.phone}
                      onChange={(e) =>
                        setPharmacy((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+250 ..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-address">Address (optional)</Label>
                  <Input
                    id="ph-address"
                    value={pharmacy.address}
                    onChange={(e) =>
                      setPharmacy((p) => ({
                        ...p,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph-email">Business email</Label>
                  <Input
                    id="ph-email"
                    type="email"
                    value={pharmacy.email}
                    onChange={(e) =>
                      setPharmacy((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="contact@yourpharmacy.rw"
                  />
                </div>
              </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-muted/30">
                  {pharmacySaved ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => goToStep(2)}
                    >
                      Continue to plan
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : pharmacySaved ? (
                      "Save changes"
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
            </form>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Choose a plan</CardTitle>
                <CardDescription>
                  Plans are managed by Pryrox. Pick the tier that fits you;
                  you can change later from Settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    Loading plans…
                  </div>
                ) : plansError ? (
                  <div className="space-y-3 py-6 text-center">
                    <p className="text-sm text-destructive">{plansError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void loadPlans()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No plans available.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                    {plans.map((plan) => {
                      const selected = selectedPlan?.id === plan.id;
                      return (
                        <button
                          type="button"
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`text-left rounded-lg border p-4 transition-all hover:border-primary/50 ${
                            selected
                              ? "border-primary ring-2 ring-primary/20 bg-card"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-semibold">{plan.name}</span>
                            {plan.is_popular ? (
                              <Badge variant="secondary">Popular</Badge>
                            ) : null}
                          </div>
                          <p className="text-2xl font-bold">
                            {Number(plan.price).toLocaleString()}{" "}
                            <span className="text-sm font-normal text-muted-foreground">
                              RWF
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {plan.period}
                          </p>
                          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                            {(plan.features || []).slice(0, 4).map((f) => (
                              <li key={f} className="flex gap-2">
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/30">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goToStep(1)}
                  >
                    Back
                  </Button>
                <Button type="button" onClick={continueToCheckout}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 3 && selectedPlan && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>
                {selectedPlan.price === 0
                  ? "Start on this plan at no charge. You can upgrade anytime."
                  : "Pay with Mobile Money (Rwanda). Card checkout opens in a secure window when available."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border bg-muted/20 p-4 text-sm">
                <p className="font-medium">{selectedPlan.name}</p>
                <p className="text-muted-foreground">
                  {Number(selectedPlan.price).toLocaleString()} RWF —{" "}
                  {selectedPlan.period}
                </p>
              </div>

              {selectedPlan.price === 0 ? null : (
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="pay-phone">MTN / Airtel number</Label>
                    <Input
                      id="pay-phone"
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="0788123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pay-email">Email for receipt</Label>
                    <Input
                      id="pay-email"
                      type="email"
                      value={paymentEmail}
                      onChange={(e) => setPaymentEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2 border-t bg-muted/30">
              <Button
                type="button"
                variant="ghost"
                onClick={() => goToStep(2)}
                disabled={loading}
              >
                Back
              </Button>
              <div className="flex gap-2">
                {selectedPlan.price === 0 ? (
                  <Button
                    type="button"
                    onClick={() => void completeFreePlan()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Start with this plan"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void payWithMobileMoney()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Pay with Mobile Money"
                    )}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Wrong account?{" "}
          <Link href="/sign-in" className="underline hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
