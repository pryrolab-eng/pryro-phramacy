"use client";

import { useSearchParams } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";

type Props = {
  onViewPlans?: () => void;
};

export function UpgradeFeatureBanner({ onViewPlans }: Props) {
  const searchParams = useSearchParams();
  const upgradeKey = searchParams.get("upgrade");
  const { can, featureLabel, entitlements, isPending } = usePharmacyEntitlements();

  if (isPending || !upgradeKey || can(upgradeKey)) {
    return null;
  }

  const label = featureLabel(upgradeKey);
  const planName = entitlements.effectivePlan?.name;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Unlock {label}
            </p>
            <p className="text-sm text-muted-foreground">
              {planName
                ? `Your current plan (${planName}) does not include this capability.`
                : "Subscribe to a plan that includes this capability."}{" "}
              Choose a higher plan below to get access.
            </p>
          </div>
        </div>
        {onViewPlans ? (
          <Button size="sm" className="shrink-0" onClick={onViewPlans}>
            Compare plans
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
