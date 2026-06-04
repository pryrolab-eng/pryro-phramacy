"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@/components/dashboard";
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
} from "@/lib/http/insurance-covered-medications";
import { pharmacyInsuranceCoverageColumns } from "@/components/pharmacy/pharmacy-insurance-coverage-columns";

export function PharmacyInsuranceMedicinesPanel() {
  const queryClient = useQueryClient();
  const [providerId, setProviderId] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const providersQuery = useQuery({
    queryKey: insuranceProvidersQueryKey,
    queryFn: getInsuranceProviders,
  });

  const providers = useMemo(() => {
    const rows = providersQuery.data ?? [];
    return rows.filter((p) => p.is_active !== false);
  }, [providersQuery.data]);

  useEffect(() => {
    if (providerId || providers.length === 0) return;
    setProviderId(providers[0].id);
  }, [providers, providerId]);

  const medsQuery = useQuery({
    queryKey: insuranceCoveredMedicationsKey(providerId),
    queryFn: () => getInsuranceCoveredMedications(providerId),
    enabled: Boolean(providerId),
  });

  const patchMutation = useMutation({
    mutationFn: patchInsuranceCoveredMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: insuranceCoveredMedicationsKey(providerId),
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not update coverage");
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
        saving: patchMutation.isPending,
        onToggle: (med, covered) => {
          patchMutation.mutate(
            {
              medicationId: med.id,
              providerId,
              covered,
              externalCode: med.externalCode,
              notes: med.notes,
            },
            {
              onSuccess: () => {
                toast.success(
                  covered
                    ? `${med.name} marked covered`
                    : `${med.name} marked not covered`,
                );
              },
            },
          );
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

  return (
    <>
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

      {providerId && !medsQuery.isPending ? (
        <DashboardMetricGrid>
          <DashboardStatCard
            label="Covered"
            icon={HeartPulse}
            value={String(coveredCount)}
            hint={`For ${provider?.name ?? "selected insurer"}`}
          />
          <DashboardStatCard
            label="In catalog"
            icon={Package}
            value={String(medications.length)}
            hint="Active products shown"
          />
          <DashboardStatCard
            label="Not covered"
            icon={UserX}
            value={String(Math.max(0, medications.length - coveredCount))}
            hint="Patient pays 100% at POS"
          />
        </DashboardMetricGrid>
      ) : null}

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
              disabled={providersQuery.isPending}
            >
              <SelectTrigger
                id="insurer-select"
                className="w-full sm:w-[200px]"
                aria-label="Insurer"
              >
                <SelectValue
                  placeholder={
                    providersQuery.isPending ? "Loading insurers…" : "Insurer"
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
          (medsQuery.isPending || (medsQuery.isFetching && medications.length === 0))
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
