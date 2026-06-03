"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, CreditCard, Plus, Wrench } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import {
  DashboardButton,
  DashboardDialogActions,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardMetricGrid,
  DashboardSearchInput,
  DashboardStatCard,
  DashboardDataTable,
  DashboardConfirmDialog,
} from "@/components/dashboard";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { AdminPharmacyDetailDialog } from "@/components/admin/admin-pharmacy-detail-dialog";
import { createAdminStoresColumns } from "@/components/admin/admin-stores-columns";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  adminPharmaciesQueryKey,
  useAdminPharmacies,
  useAdminPlans,
  useInsuranceProviders,
} from "@/hooks";
import type { InsuranceProviderRow } from "@/hooks";
import type { AdminPharmacyRow } from "@/lib/http/admin/pharmacies";
import {
  createAdminPharmacy,
  deleteAdminPharmacy,
  repairAdminPharmacies,
  updateAdminPharmacy,
} from "@/lib/http/admin/pharmacies";
import { ApiError } from "@/lib/http/client";
import {
  planSelectOptionsFromCatalog,
  resolvePharmacyPlanDisplay,
  resolvePharmacyPlanLabel,
  type CatalogPlanLike,
  type PlanSelectOption,
} from "@/lib/admin/plan-stats";

const emptyPharmacyForm = () => ({
  name: "",
  address: "",
  phone: "",
  email: "",
  license_number: "",
  owner_name: "",
  owner_email: "",
  owner_password: "",
  subscription_plan: "",
  insurance_providers: [] as string[],
});

function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function PlanSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: PlanSelectOption[];
}) {
  const resolved =
    value ||
    options.find((o) => o.isFree)?.value ||
    options[0]?.value ||
    "trial";

  return (
    <Select value={resolved} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select plan" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
            {opt.isFree ? " · Free" : ` · RWF ${opt.price.toLocaleString()}/mo`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function pharmacyMatchesPlanFilter(
  pharmacy: AdminPharmacyRow,
  planFilter: string,
  catalog: CatalogPlanLike[],
  planOptions: PlanSelectOption[],
): boolean {
  if (planFilter === "all") return true;
  if (planFilter === "free") {
    return Boolean(pharmacy.is_free_plan);
  }
  const opt = planOptions.find((o) => o.value === planFilter);
  if (opt) {
    const display = resolvePharmacyPlanDisplay(
      {
        subscription_plan: String(pharmacy.subscription_plan ?? ""),
        catalog_plan_name: pharmacy.catalog_plan_name as string | null | undefined,
        catalog_plan_price: pharmacy.catalog_plan_price as number | null | undefined,
        is_free_plan: pharmacy.is_free_plan as boolean | null | undefined,
      },
      catalog,
    );
    return display.name === opt.label;
  }
  return false;
}

export function AdminStoresPanel() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const pharmaciesQuery = useAdminPharmacies();
  const plansQuery = useAdminPlans();
  const insuranceQuery = useInsuranceProviders();

  const [search, setSearch] = useState(
    () => searchParams.get("search")?.trim() ?? "",
  );

  useEffect(() => {
    const fromUrl = searchParams.get("search")?.trim() ?? "";
    if (fromUrl) setSearch(fromUrl);
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [viewPharmacy, setViewPharmacy] = useState<AdminPharmacyRow | null>(null);
  const [editPharmacy, setEditPharmacy] = useState<AdminPharmacyRow | null>(null);
  const [newPharmacy, setNewPharmacy] = useState(emptyPharmacyForm);
  const [coverageOverrides, setCoverageOverrides] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingOne, setDeletingOne] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const catalog = (plansQuery.data?.plans ?? []) as CatalogPlanLike[];
  const planOptions = useMemo(() => planSelectOptionsFromCatalog(catalog), [catalog]);
  const pharmacies = pharmaciesQuery.data ?? [];
  const insurance = insuranceQuery.data ?? [];
  const loading =
    pharmaciesQuery.isLoading || insuranceQuery.isLoading || plansQuery.isLoading;

  const stats = useMemo(() => {
    let activeAccess = 0;
    let freePlans = 0;
    let paidPlans = 0;
    for (const p of pharmacies) {
      const status = String(p.status ?? "active").toLowerCase();
      if (status === "active") activeAccess += 1;
      if (p.is_free_plan) freePlans += 1;
      else paidPlans += 1;
    }
    return {
      total: pharmacies.length,
      activeAccess,
      freePlans,
      paidPlans,
    };
  }, [pharmacies]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pharmacies.filter((p) => {
      const status = String(p.status ?? "active").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!pharmacyMatchesPlanFilter(p, planFilter, catalog, planOptions)) {
        return false;
      }
      if (!q) return true;
      const planLabel = resolvePharmacyPlanLabel(
        {
          subscription_plan: String(p.subscription_plan ?? ""),
          catalog_plan_name: p.catalog_plan_name as string | null | undefined,
          catalog_plan_price: p.catalog_plan_price as number | null | undefined,
          is_free_plan: p.is_free_plan as boolean | null | undefined,
        },
        catalog,
      ).toLowerCase();
      return (
        String(p.name ?? "").toLowerCase().includes(q) ||
        String(p.email ?? "").toLowerCase().includes(q) ||
        String(p.license_number ?? "").toLowerCase().includes(q) ||
        String(p.address ?? "").toLowerCase().includes(q) ||
        planLabel.includes(q)
      );
    });
  }, [pharmacies, search, statusFilter, planFilter, catalog, planOptions]);

  // Keep selection consistent with current filtered set
  const filteredIdSet = useMemo(
    () => new Set(filtered.map((p) => String(p.id))),
    [filtered],
  );
  const selectedInView = useMemo(
    () => selectedIds.filter((id) => filteredIdSet.has(id)),
    [selectedIds, filteredIdSet],
  );
  const allSelectedInView =
    filtered.length > 0 && selectedInView.length === filtered.length;
  const someSelectedInView =
    selectedInView.length > 0 && selectedInView.length < filtered.length;

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((x) => x !== id);
    });
  };

  const toggleSelectAllInView = (checked: boolean) => {
    setSelectedIds((prev) => {
      const rest = prev.filter((id) => !filteredIdSet.has(id));
      if (!checked) return rest;
      return Array.from(new Set([...rest, ...Array.from(filteredIdSet)]));
    });
  };

  const getCoverage = (provider: InsuranceProviderRow) =>
    coverageOverrides[provider.id] ??
    (provider.coverage_percentage as number | undefined) ??
    0;

  const toggleInsurance = (
    ids: string[],
    id: string,
    checked: boolean,
  ): string[] => {
    if (checked) return [...ids, id];
    return ids.filter((x) => x !== id);
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminPharmaciesQueryKey });

  const handleRepair = async () => {
    setRepairing(true);
    try {
      const result = await repairAdminPharmacies();
      await invalidate();
      toast({
        title: "Data repaired",
        description: `${result.pharmaciesSynced} pharmacies synced · ${result.branchAddonReclassified ?? 0} branch add-ons reclassified · ${result.duplicateSubsCancelled} duplicate subs removed · ${result.trialStatusNormalized} legacy statuses fixed`,
      });
    } catch (e) {
      toast({
        title: "Repair failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRepairing(false);
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await createAdminPharmacy({
        ...newPharmacy,
        subscription_plan:
          newPharmacy.subscription_plan ||
          planOptions.find((o) => o.isFree)?.value ||
          planOptions[0]?.value,
      } as Record<string, unknown>);
      await invalidate();
      setAddOpen(false);
      setNewPharmacy(emptyPharmacyForm());
      toast({ title: "Pharmacy created" });
    } catch (e) {
      toast({
        title: "Could not create pharmacy",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editPharmacy?.id) return;
    setSaving(true);
    try {
      const payload = {
        ...editPharmacy,
        subscription_plan: String(editPharmacy.subscription_plan ?? ""),
      };
      await updateAdminPharmacy(editPharmacy.id, payload as Record<string, unknown>);
      await invalidate();
      setEditPharmacy(null);
      toast({ title: "Pharmacy updated" });
    } catch (e) {
      toast({
        title: "Could not update pharmacy",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteOne = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingOne(true);
    try {
      await deleteAdminPharmacy(id);
      setDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      toast({ title: "Pharmacy deleted" });
      void invalidate();
    } catch (e) {
      toast({
        title: "Could not delete",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeletingOne(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedInView;
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      const byId = new Map(pharmacies.map((p) => [String(p.id), p]));
      let deleted = 0;
      const blocked: string[] = [];

      for (const id of ids) {
        const name = String(byId.get(id)?.name ?? "pharmacy");
        try {
          await deleteAdminPharmacy(id);
          deleted += 1;
        } catch (e) {
          if (e instanceof ApiError && e.status === 400) {
            blocked.push(name);
            continue;
          }
          // Any non-validation error should still be visible as blocked.
          blocked.push(name);
        }
      }

      setBulkDeleteOpen(false);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));

      if (blocked.length > 0) {
        toast({
          title: "Some pharmacies were not deleted",
          description: `${deleted} deleted · ${blocked.length} blocked (has subscription).`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Pharmacies deleted", description: `${deleted} deleted.` });
      }

      void invalidate();
      void pharmaciesQuery.refetch();
    } finally {
      setBulkDeleting(false);
    }
  };

  const openEdit = (pharmacy: AdminPharmacyRow) => {
    const display = resolvePharmacyPlanDisplay(
      {
        subscription_plan: String(pharmacy.subscription_plan ?? ""),
        catalog_plan_name: pharmacy.catalog_plan_name as string | null | undefined,
        catalog_plan_price: pharmacy.catalog_plan_price as number | null | undefined,
        is_free_plan: pharmacy.is_free_plan as boolean | null | undefined,
      },
      catalog,
    );
    const matchedOption =
      planOptions.find((o) => o.label === display.name) ??
      planOptions.find((o) => o.isFree === display.isFree) ??
      planOptions[0];

    setEditPharmacy({
      ...pharmacy,
      subscription_plan: matchedOption?.value ?? "",
      insurance_providers: (pharmacy.insurance_providers as string[]) || [],
      owner_name: String(pharmacy.owner_name ?? ""),
      owner_email: String(pharmacy.owner_email ?? pharmacy.email ?? ""),
      new_password: "",
    });
  };

  const columns = useMemo(
    () => {
      const selectCol = {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        meta: { className: "w-12" },
        header: () => (
          <Checkbox
            checked={allSelectedInView ? true : someSelectedInView ? "indeterminate" : false}
            onCheckedChange={(v) => toggleSelectAllInView(Boolean(v))}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: any) => {
          const id = String(row.original.id);
          const checked = selectedIds.includes(id);
          return (
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => toggleSelectOne(id, Boolean(v))}
              aria-label="Select row"
            />
          );
        },
      };

      return [
        selectCol as any,
        ...createAdminStoresColumns(catalog, {
        onView: setViewPharmacy,
        onEdit: openEdit,
        onDelete: (id, name) => {
          setDeleteTarget({ id, name });
        },
      }),
      ];
    },
    [catalog, selectedIds, allSelectedInView, someSelectedInView, filteredIdSet],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-6" />
        <p className="text-sm text-neutral-500">Loading pharmacies…</p>
      </div>
    );
  }

  const filterToolbar = (
    <>
      <DashboardSearchInput
        placeholder="Search name, email, license, address…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-w-[200px] flex-1"
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger
          className={cn(
            "h-8 w-full rounded-lg border-neutral-200/80 bg-white text-sm shadow-sm lg:w-[160px] dark:border-neutral-700 dark:bg-neutral-900",
          )}
        >
          <SelectValue placeholder="Access" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All access</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select value={planFilter} onValueChange={setPlanFilter}>
        <SelectTrigger
          className={cn(
            "h-8 w-full rounded-lg border-neutral-200/80 bg-white text-sm shadow-sm lg:w-[180px] dark:border-neutral-700 dark:bg-neutral-900",
          )}
        >
          <SelectValue placeholder="Plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All plans</SelectItem>
          <SelectItem value="free">All free plans</SelectItem>
          {planOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
              {opt.isFree ? " (Free)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <>
        <AdminPageHeader
          pinTitle="Pharmacies"
          title="Pharmacies"
          description="Registered stores, subscription tier, and account access status."
          actions={
            <>
              <DashboardButton
                tone="outline"
                onClick={handleRepair}
                disabled={repairing}
              >
                <Wrench className="mr-2 h-4 w-4" strokeWidth={1.75} />
                {repairing ? "Repairing…" : "Repair data"}
              </DashboardButton>
              <DashboardButton tone="outline" asChild>
                <Link href="/admin/subscriptions">
                  <CreditCard className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Plans
                </Link>
              </DashboardButton>
              <DashboardButton
                tone="primary"
                onClick={() => {
                  setNewPharmacy({
                    ...emptyPharmacyForm(),
                    subscription_plan:
                      planOptions.find((o) => o.isFree)?.value ??
                      planOptions[0]?.value ??
                      "",
                  });
                  setAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Add pharmacy
              </DashboardButton>
            </>
          }
        />

        <DashboardMetricGrid>
          <DashboardStatCard
            label="Total stores"
            icon={Building2}
            value={stats.total}
          />
          <DashboardStatCard
            label="Active accounts"
            icon={Building2}
            value={stats.activeAccess}
            hint="Can use the app"
          />
          <DashboardStatCard
            label="Paid plans"
            icon={CreditCard}
            value={stats.paidPlans}
          />
          <DashboardStatCard
            label="Free plans"
            icon={CreditCard}
            value={stats.freePlans}
            hint="RWF 0 / no price"
          />
        </DashboardMetricGrid>

        <DashboardDataTable
          title="All pharmacies"
          description={`${filtered.length} of ${pharmacies.length} shown`}
          toolbar={filterToolbar}
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 20, 50]}
          emptyMessage="No pharmacies match your filters."
          tableHeader={
            selectedInView.length > 0 ? (
              <div
                className={cn(
                  "mx-4 mb-3 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/40",
                )}
              >
                <p className="text-neutral-500">
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    {selectedInView.length}
                  </span>{" "}
                  selected
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <DashboardButton
                    tone="outline"
                    onClick={() =>
                      setSelectedIds((prev) =>
                        prev.filter((id) => !filteredIdSet.has(id)),
                      )
                    }
                  >
                    Clear selection
                  </DashboardButton>
                  <DashboardButton
                    tone="destructive"
                    disabled={bulkDeleting}
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    Delete selected
                  </DashboardButton>
                </div>
              </div>
            ) : null
          }
        />

      <DashboardConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (open || deletingOne) return;
          setDeleteTarget(null);
        }}
        title="Delete pharmacy?"
        description={
          <>
            <span className="font-medium text-neutral-900 dark:text-neutral-50">
              {deleteTarget?.name}
            </span>{" "}
            will be removed permanently. Unpaid checkouts are cancelled
            automatically; stores with an active paid plan cannot be deleted.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => void confirmDeleteOne()}
        confirmDisabled={deletingOne}
        loading={deletingOne}
      />

      <DashboardConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!bulkDeleting) setBulkDeleteOpen(open);
        }}
        title="Delete selected pharmacies?"
        description="This cannot be undone. Pending checkouts are cancelled first. Stores with an active subscription will be skipped."
        confirmLabel={`Delete ${selectedInView.length}`}
        onConfirm={() => void handleBulkDelete()}
        confirmDisabled={bulkDeleting || selectedInView.length === 0}
        loading={bulkDeleting}
      />

      {viewPharmacy ? (
        <AdminPharmacyDetailDialog
          key={String(viewPharmacy.id ?? viewPharmacy.name)}
          pharmacy={viewPharmacy}
          catalog={catalog}
          onClose={() => setViewPharmacy(null)}
        />
      ) : null}

      {/* Add */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DashboardDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add pharmacy</DashboardDialogTitle>
            <DashboardDialogDescription>
              Create a store and owner login.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <div className="max-h-[min(70vh,28rem)] overflow-y-auto px-5 py-4">
            <PharmacyForm
              data={newPharmacy}
              onChange={(patch) => setNewPharmacy((p) => ({ ...p, ...patch }))}
              planOptions={planOptions}
              insurance={insurance}
              getCoverage={getCoverage}
              coverageOverrides={coverageOverrides}
              setCoverageOverrides={setCoverageOverrides}
              toggleInsurance={(id, checked) =>
                setNewPharmacy((p) => ({
                  ...p,
                  insurance_providers: toggleInsurance(
                    p.insurance_providers,
                    id,
                    checked,
                  ),
                }))
              }
            />
          </div>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Create pharmacy"
            onCancel={() => setAddOpen(false)}
            onConfirm={handleAdd}
            confirmDisabled={!newPharmacy.name || !newPharmacy.owner_email}
            confirmLoading={saving}
          />
        </DashboardDialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={Boolean(editPharmacy)} onOpenChange={(o) => !o && setEditPharmacy(null)}>
        <DashboardDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Edit pharmacy</DashboardDialogTitle>
            <DashboardDialogDescription>
              Plan changes here update the store cache; paid billing still flows through
              subscriptions.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          {editPharmacy ? (
            <>
              <div className="max-h-[min(70vh,28rem)] overflow-y-auto px-5 py-4">
                <PharmacyForm
                  data={editPharmacy as unknown as PharmacyFormData}
                  onChange={(patch) =>
                    setEditPharmacy((prev) => (prev ? { ...prev, ...patch } : prev))
                  }
                  planOptions={planOptions}
                  insurance={insurance}
                  getCoverage={getCoverage}
                  coverageOverrides={coverageOverrides}
                  setCoverageOverrides={setCoverageOverrides}
                  toggleInsurance={(id, checked) =>
                    setEditPharmacy((prev) =>
                      prev
                        ? {
                            ...prev,
                            insurance_providers: toggleInsurance(
                              (prev.insurance_providers as string[]) || [],
                              id,
                              checked,
                            ),
                          }
                        : prev,
                    )
                  }
                  showPassword
                />
              </div>
              <DashboardDialogActions
                cancelLabel="Cancel"
                confirmLabel="Save changes"
                onCancel={() => setEditPharmacy(null)}
                onConfirm={handleEdit}
                confirmLoading={saving}
              />
            </>
          ) : null}
        </DashboardDialogContent>
      </Dialog>
    </>
  );
}

type PharmacyFormData = ReturnType<typeof emptyPharmacyForm> & {
  new_password?: string;
};

function PharmacyForm({
  data,
  onChange,
  planOptions,
  insurance,
  getCoverage,
  coverageOverrides,
  setCoverageOverrides,
  toggleInsurance,
  showPassword,
}: {
  data: PharmacyFormData;
  onChange: (patch: Partial<PharmacyFormData>) => void;
  planOptions: PlanSelectOption[];
  insurance: InsuranceProviderRow[];
  getCoverage: (p: InsuranceProviderRow) => number;
  coverageOverrides: Record<string, number>;
  setCoverageOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  toggleInsurance: (id: string, checked: boolean) => void;
  showPassword?: boolean;
}) {
  const set = (patch: Partial<PharmacyFormData>) => onChange(patch);

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Pharmacy name</Label>
          <Input value={data.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>License number</Label>
          <Input
            value={data.license_number}
            onChange={(e) => set({ license_number: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Subscription plan (initial tier)</Label>
        <PlanSelect
          value={data.subscription_plan}
          onChange={(v) => set({ subscription_plan: v })}
          options={planOptions}
        />
      </div>
      <div className="grid gap-2">
        <Label>Address</Label>
        <Input value={data.address} onChange={(e) => set({ address: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Phone</Label>
          <Input value={data.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Contact email</Label>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Owner name</Label>
          <Input
            value={data.owner_name}
            onChange={(e) => set({ owner_name: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Owner login email</Label>
          <Input
            type="email"
            value={data.owner_email}
            onChange={(e) => set({ owner_email: e.target.value })}
          />
        </div>
      </div>
      {showPassword ? (
        <div className="grid gap-2">
          <Label>New password (optional)</Label>
          <PasswordInput
            value={data.new_password ?? ""}
            onChange={(e) => set({ new_password: e.target.value })}
            placeholder="Leave blank to keep current"
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>Owner password</Label>
          <PasswordInput
            value={data.owner_password}
            onChange={(e) => set({ owner_password: e.target.value })}
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label>Insurance providers</Label>
        <div className="max-h-40 space-y-3 overflow-y-auto rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          {insurance.map((provider) => (
            <div key={provider.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`ins-${provider.id}`}
                  checked={data.insurance_providers.includes(provider.id)}
                  onCheckedChange={(v) => toggleInsurance(provider.id, Boolean(v))}
                />
                <label htmlFor={`ins-${provider.id}`} className="text-sm font-medium">
                  {String(provider.name ?? "")}
                </label>
              </div>
              {data.insurance_providers.includes(provider.id) ? (
                <div className="ml-6 text-xs text-muted-foreground">
                  Coverage: {getCoverage(provider)}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    className="mt-1 w-full"
                    value={getCoverage(provider)}
                    onChange={(e) =>
                      setCoverageOverrides((prev) => ({
                        ...prev,
                        [provider.id]: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
