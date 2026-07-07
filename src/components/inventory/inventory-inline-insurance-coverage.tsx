"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { inventoryInsuranceHref } from "@/lib/routes/pharmacy-paths";
import { useInsuranceProviders } from "@/hooks/useInsuranceProviders";
import {
  emptyInsuranceCoverageDraft,
  getMedicationInsuranceCoverage,
  insuranceDraftFromProviders,
  medicationInsuranceCoverageKey,
  type InsuranceCoverageDraft,
} from "@/lib/http/insurance-covered-medications";

type Props = {
  medicationId?: string | null;
  value: InsuranceCoverageDraft;
  onChange: (draft: InsuranceCoverageDraft) => void;
};

export function InventoryInlineInsuranceCoverage({
  medicationId,
  value,
  onChange,
}: Props) {
  const providersQuery = useInsuranceProviders();

  const coverageQuery = useQuery({
    queryKey: medicationInsuranceCoverageKey(medicationId ?? ""),
    queryFn: () => getMedicationInsuranceCoverage(medicationId!),
    enabled: Boolean(medicationId),
  });

  const providerRows = useMemo(() => {
    if (medicationId && coverageQuery.data?.providers) {
      return coverageQuery.data.providers;
    }
    const rows = providersQuery.data ?? [];
    return rows
      .filter((p) => p.is_active !== false)
      .map((p) => ({
        id: String(p.id),
        name: String(p.name ?? p.id).trim(),
        coveragePercent: Number(
          (p as { coverage_percent?: number }).coverage_percent ??
            (p as { coveragePercent?: number }).coveragePercent ??
            0,
        ),
        covered: false,
        externalCode: null as string | null,
      }))
      .filter((p) => p.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [medicationId, coverageQuery.data, providersQuery.data]);

  const initializedKey = useRef<string | null>(null);

  useEffect(() => {
    initializedKey.current = null;
  }, [medicationId]);

  useEffect(() => {
    const key = medicationId ?? "__add__";
    if (initializedKey.current === key) return;

    if (medicationId && coverageQuery.data?.providers) {
      initializedKey.current = key;
      onChange(insuranceDraftFromProviders(coverageQuery.data.providers));
      return;
    }

    if (!medicationId && providerRows.length > 0) {
      initializedKey.current = key;
      const draft = emptyInsuranceCoverageDraft();
      for (const p of providerRows) {
        draft[p.id] = { covered: false, externalCode: "" };
      }
      onChange(draft);
    }
  }, [medicationId, coverageQuery.data, providerRows, onChange]);

  const loading =
    providersQuery.isPending ||
    (Boolean(medicationId) && coverageQuery.isPending);

  const setProvider = (
    providerId: string,
    patch: Partial<{ covered: boolean; externalCode: string }>,
  ) => {
    const current = value[providerId] ?? { covered: false, externalCode: "" };
    onChange({
      ...value,
      [providerId]: { ...current, ...patch },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading insurers…
      </div>
    );
  }

  if (providerRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No active insurance providers. Add insurers in Settings → Insurance.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-muted-foreground" />
          <div>
            <Label className="text-base">Insurer coverage</Label>
            <p className="text-xs text-muted-foreground">
              Applies to this medication at all branches (not per batch).
            </p>
          </div>
        </div>
        <Link
          href={inventoryInsuranceHref()}
          className="shrink-0 text-xs text-primary hover:underline"
        >
          Bulk manage
        </Link>
      </div>
      <Separator />
      <ul className="space-y-3">
        {providerRows.map((provider) => {
          const entry = value[provider.id] ?? {
            covered: false,
            externalCode: "",
          };
          return (
            <li
              key={provider.id}
              className="flex flex-col gap-2 rounded-md border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{provider.name}</p>
                {provider.coveragePercent > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Default plan coverage {provider.coveragePercent}%
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`inv-ins-${provider.id}`}
                    checked={entry.covered}
                    onCheckedChange={(checked) =>
                      setProvider(provider.id, { covered: checked })
                    }
                  />
                  <Label
                    htmlFor={`inv-ins-${provider.id}`}
                    className="text-sm font-normal"
                  >
                    Covered
                  </Label>
                </div>
                {entry.covered ? (
                  <Input
                    className="h-8 w-full min-w-[10rem] sm:w-40"
                    placeholder="Insurer code (optional)"
                    value={entry.externalCode}
                    onChange={(e) =>
                      setProvider(provider.id, {
                        externalCode: e.target.value,
                      })
                    }
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
