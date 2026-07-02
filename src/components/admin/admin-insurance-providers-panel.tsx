"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { adminInsuranceProviderColumns } from "@/components/admin/admin-insurance-providers-columns";
import {
  DashboardButton,
  DashboardDataTable,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogFooter,
  DashboardDialogHeader,
  DashboardDialogTitle,
} from "@/components/dashboard";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  insuranceProvidersQueryKey,
  updateInsuranceProvider,
  type InsuranceProviderRow,
} from "@/lib/http/insurance";
import { useInsuranceProviders } from "@/hooks/useInsuranceProviders";

type EditForm = {
  name: string;
  coverage_percentage: number;
  contact_email: string;
  contact_phone: string;
  policy_number: string;
  is_active: boolean;
};

function toForm(row: InsuranceProviderRow): EditForm {
  const pct = Number(
    row.default_coverage_percent ?? row.coverage_percentage ?? 0,
  );
  return {
    name: String(row.name ?? ""),
    coverage_percentage: pct,
    contact_email: String(row.contact_email ?? ""),
    contact_phone: String(row.contact_phone ?? ""),
    policy_number: String(row.policy_number ?? ""),
    is_active: row.is_active !== false,
  };
}

export function AdminInsuranceProvidersPanel() {
  const queryClient = useQueryClient();
  const providersQuery = useInsuranceProviders();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<InsuranceProviderRow | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

  const providers = useMemo(() => {
    const rows = providersQuery.data ?? [];
    return [...rows].sort((a, b) =>
      String(a.name ?? "").localeCompare(String(b.name ?? "")),
    );
  }, [providersQuery.data]);

  const columns = useMemo(
    () =>
      adminInsuranceProviderColumns({
        onEdit: (row) => {
          setEditing(row);
          setForm(toForm(row));
        },
      }),
    [],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editing?.id || !form) return;
      await updateInsuranceProvider(editing.id, {
        name: form.name.trim(),
        coverage_percentage: form.coverage_percentage,
        default_coverage_percent: form.coverage_percentage,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        policy_number: form.policy_number.trim() || null,
        is_active: form.is_active,
      });
    },
    onSuccess: () => {
      toast.success("Provider updated");
      queryClient.invalidateQueries({ queryKey: insuranceProvidersQueryKey });
      setEditing(null);
      setForm(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Update failed");
    },
  });

  return (
    <>
      <DashboardDataTable
        title="Insurance providers"
        description="Global insurers used at POS and on monthly reports. Deactivating hides a provider from pharmacy lists."
        searchPlaceholder="Search providers…"
        searchValue={search}
        onSearchChange={setSearch}
        columns={columns}
        data={providers}
        pageSize={10}
        pageSizeOptions={[10, 15, 25]}
        stickyHeader
        initialSorting={[{ id: "name", desc: false }]}
        emptyMessage="No providers yet. Use Add provider to create one."
        isLoading={providersQuery.isPending && providers.length === 0}
        error={
          providersQuery.isError
            ? providersQuery.error instanceof Error
              ? providersQuery.error.message
              : "Failed to load providers"
            : null
        }
      />

      <Dialog
        open={Boolean(editing && form)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setForm(null);
          }
        }}
      >
        <DashboardDialogContent>
          <DashboardDialogHeader>
            <DashboardDialogTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Edit provider
            </DashboardDialogTitle>
          </DashboardDialogHeader>
          {form ? (
            <DashboardDialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prov-name">Name</Label>
                <Input
                  id="edit-prov-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prov-pct">Default coverage %</Label>
                <Input
                  id="edit-prov-pct"
                  type="number"
                  min={0}
                  max={100}
                  value={form.coverage_percentage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      coverage_percentage: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prov-email">Contact email</Label>
                <Input
                  id="edit-prov-email"
                  value={form.contact_email}
                  onChange={(e) =>
                    setForm({ ...form, contact_email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prov-phone">Contact phone</Label>
                <Input
                  id="edit-prov-phone"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm({ ...form, contact_phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prov-policy">Policy number</Label>
                <Input
                  id="edit-prov-policy"
                  value={form.policy_number}
                  onChange={(e) =>
                    setForm({ ...form, policy_number: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="edit-prov-active">Active at POS</Label>
                <Switch
                  id="edit-prov-active"
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_active: checked })
                  }
                />
              </div>
            </DashboardDialogBody>
          ) : null}
          <DashboardDialogFooter>
            <DashboardButton
              variant="outline"
              onClick={() => {
                setEditing(null);
                setForm(null);
              }}
            >
              Cancel
            </DashboardButton>
            <DashboardButton
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form?.name.trim()}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>
    </>
  );
}
