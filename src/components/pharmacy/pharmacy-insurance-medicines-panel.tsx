"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { HeartPulse, Package, Receipt, UserX } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardDataTable,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardButton,
  DashboardToolbar,
  DashboardSearchInput,
  DashboardSectionCard,
} from "@/components/dashboard";
import { InsurancePriceManager } from "@/components/insurance-price-manager";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getInsuranceProviders,
  insuranceProvidersQueryKey,
} from "@/lib/http/insurance";
import {
  getInsuranceCoveredMedications,
  insuranceCoveredMedicationsKey,
  patchInsuranceCoveredMedication,
  type InsuranceCoveredMedicationsResponse,
  type PatchInsuranceCoveredMedicationInput,
} from "@/lib/http/insurance-covered-medications";
import { pharmacyInsuranceCoverageColumns } from "@/components/pharmacy/pharmacy-insurance-coverage-columns";

type PharmacyInsuranceMedicinesPanelProps = {
  /** When true, omit page header (used inside Inventory → Insurance tab). */
  embedded?: boolean;
  /** Open formulary upload on mount (from ?import=1). */
  autoOpenImport?: boolean;
};

const LIST_STALE_MS = 5 * 60 * 1000;

export function PharmacyInsuranceMedicinesPanel({
  embedded = false,
  autoOpenImport,
}: PharmacyInsuranceMedicinesPanelProps = {}) {
  const searchParams = useSearchParams();
  const queryImport =
    autoOpenImport ?? searchParams.get("import") === "1";
  const queryClient = useQueryClient();
  const [providerId, setProviderId] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const providersQuery = useQuery({
    queryKey: insuranceProvidersQueryKey,
    queryFn: getInsuranceProviders,
    staleTime: LIST_STALE_MS,
  });

  const providers = useMemo(() => {
    const rows = providersQuery.data ?? [];
    return rows.filter((p) => p.is_active !== false);
  }, [providersQuery.data]);

  useEffect(() => {
    if (providerId || providers.length === 0) return;
    setProviderId(providers[0].id);
  }, [providers, providerId]);

  const medsKey = insuranceCoveredMedicationsKey(providerId);

  const medsQuery = useQuery({
    queryKey: medsKey,
    queryFn: () => getInsuranceCoveredMedications(providerId),
    enabled: Boolean(providerId),
    staleTime: LIST_STALE_MS,
  });

  const patchMutation = useMutation({
    mutationFn: patchInsuranceCoveredMedication,
    onMutate: async (vars: PatchInsuranceCoveredMedicationInput) => {
      await queryClient.cancelQueries({ queryKey: medsKey });
      const previous =
        queryClient.getQueryData<InsuranceCoveredMedicationsResponse>(medsKey);

      if (previous) {
        queryClient.setQueryData<InsuranceCoveredMedicationsResponse>(medsKey, {
          ...previous,
          medications: previous.medications.map((m) =>
            m.id === vars.medicationId
              ? {
                  ...m,
                  covered: vars.covered,
                  externalCode:
                    vars.externalCode === undefined
                      ? m.externalCode
                      : vars.externalCode,
                  notes:
                    vars.notes === undefined ? m.notes : vars.notes,
                }
              : m,
          ),
        });
      }

      return { previous };
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(medsKey, context.previous);
      }
      toast.error(err.message || "Could not update coverage");
    },
    onSuccess: (_data, vars) => {
      toast.success(
        vars.covered
          ? "Marked covered"
          : "Marked not covered",
      );
    },
  });

  const provider = medsQuery.data?.provider;
  const medications = medsQuery.data?.medications ?? [];

  const coveredCount = useMemo(
    () => medications.filter((m) => m.covered).length,
    [medications],
  );

  const columns = useMemo(
    () =>
      pharmacyInsuranceCoverageColumns({
        onToggle: (med, covered) => {
          patchMutation.mutate({
            medicationId: med.id,
            providerId,
            covered,
            externalCode: med.externalCode,
            notes: med.notes,
          });
        },
        onExternalCode: (med, externalCode) => {
          patchMutation.mutate({
            medicationId: med.id,
            providerId,
            covered: med.covered,
            externalCode,
            notes: med.notes,
          });
        },
      }),
    [patchMutation, providerId],
  );

  const medsLoading = medsQuery.isPending;
  const showMedsStats = Boolean(providerId) && (Boolean(medsQuery.data) || !medsLoading);

  return (
    <>
      {embedded ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Map insurer formularies to your catalog so POS can apply reimbursement. Uncovered
          products are charged fully to the patient.
        </p>
      ) : (
        <DashboardPageHeader
          title="Insurer coverage"
          description="Choose which products in your catalog each insurer will pay for at POS. Uncovered lines are charged fully to the patient."
          actions={
            <DashboardToolbar>
              <DashboardButton tone="outline" asChild>
                <Link href={PHARMACY_ROUTES.pos}>
                  <Receipt className="h-4 w-4" />
                  Open POS
                </Link>
              </DashboardButton>
            </DashboardToolbar>
          }
        />
      )}

      {showMedsStats ? (
        <DashboardMetricGrid>
          <DashboardStatCard
            label="Covered"
            icon={HeartPulse}
            value={String(coveredCount)}
            hint={`For ${provider?.name ?? "selected insurer"}`}
            loading={medsLoading}
          />
          <DashboardStatCard
            label="In catalog"
            icon={Package}
            value={String(medications.length)}
            hint="Active products shown"
            loading={medsLoading}
          />
          <DashboardStatCard
            label="Not covered"
            icon={UserX}
            value={String(Math.max(0, medications.length - coveredCount))}
            hint="Patient pays 100% at POS"
            loading={medsLoading}
          />
        </DashboardMetricGrid>
      ) : null}

      <DashboardSectionCard
        title="Bulk coverage import"
        description="Upload the insurer formulary, review suggested matches to your catalog, then confirm before coverage is applied."
        className="mb-4"
        contentClassName="p-0"
      >
        <InsurancePriceManager autoOpen={queryImport} />
      </DashboardSectionCard>

      <DashboardDataTable
        title="Product coverage"
        description={
          provider
            ? `${provider.name}: ${provider.coveragePercent}% reimbursement at POS on covered products. Toggle coverage below.`
            : "Select an insurer, then mark which catalog products are covered."
        }
        toolbar={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={providerId}
              onValueChange={(id) => {
                setProviderId(id);
                setTableSearch("");
              }}
              disabled={providersQuery.isPending && providers.length === 0}
            >
              <SelectTrigger
                id="insurer-select"
                className="w-full sm:w-[200px]"
                aria-label="Insurer"
              >
                <SelectValue
                  placeholder={
                    providersQuery.isPending && providers.length === 0
                      ? "Loading insurers…"
                      : "Insurer"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {String(p.name ?? p.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DashboardSearchInput
              placeholder="Search products…"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              disabled={!providerId}
              className="w-full min-w-0 sm:max-w-md sm:flex-1"
            />
          </div>
        }
        globalFilter={tableSearch}
        onGlobalFilterChange={setTableSearch}
        columns={columns}
        data={providerId ? medications : []}
        pageSize={15}
        pageSizeOptions={[10, 15, 25, 50]}
        stickyHeader
        initialSorting={[{ id: "name", desc: false }]}
        emptyMessage={
          providerId
            ? "No active products in your catalog. Add inventory first, then return here."
            : "Select an insurer to load your catalog."
        }
        isLoading={
          Boolean(providerId) &&
          medsQuery.isPending &&
          medications.length === 0
        }
        error={
          medsQuery.isError
            ? medsQuery.error instanceof Error
              ? medsQuery.error.message
              : "Failed to load products"
            : null
        }
      />
    </>
  );
}
