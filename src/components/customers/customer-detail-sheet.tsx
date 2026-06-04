"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Pencil, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DashboardButton,
  DashboardListRow,
  AlertDialog,
  DashboardAlertDialogContent,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
  DashboardAlertDialogDescription,
  DashboardAlertDialogActions,
} from "@/components/dashboard";
import {
  useCustomer,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from "@/hooks/useCustomers";
import type { UpdateCustomerInput } from "@/lib/http/customers";
import {
  buildCustomerInsuranceValue,
  CustomerInsuranceFields,
  splitCustomerInsuranceValue,
} from "@/components/customers/customer-insurance-fields";
import { useInsuranceProviders } from "@/hooks/useInsuranceProviders";

type Props = {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function CustomerDetailSheet({
  customerId,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const detailQuery = useCustomer(open ? customerId : null);
  const updateMutation = useUpdateCustomerMutation();
  const deleteMutation = useDeleteCustomerMutation();

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<UpdateCustomerInput>({});
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceMemberNumber, setInsuranceMemberNumber] = useState("");

  const providersQuery = useInsuranceProviders({ enabled: open });
  const customer = detailQuery.data?.customer;
  const recentSales = detailQuery.data?.recentSales ?? [];

  useEffect(() => {
    if (!customer) return;
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      dateOfBirth: customer.dateOfBirth ?? "",
      allergies:
        customer.allergies && customer.allergies !== "None"
          ? customer.allergies
          : "",
      status: customer.status === "inactive" ? "inactive" : "active",
    });
    const providerNames = (providersQuery.data ?? [])
      .map((p) => String(p.name ?? "").trim())
      .filter(Boolean);
    const split = splitCustomerInsuranceValue(
      customer.insurance,
      providerNames,
    );
    setInsuranceProvider(split.provider);
    setInsuranceMemberNumber(split.memberNumber);
    setEditing(false);
  }, [customer?.id, customer, providersQuery.data]);

  const handleSave = async () => {
    if (!customerId) return;
    try {
      const result = await updateMutation.mutateAsync({
        id: customerId,
        body: {
          ...form,
          insurance: buildCustomerInsuranceValue(
            insuranceProvider ?? "",
            insuranceMemberNumber ?? "",
          ),
        },
      });
      if (result.success) {
        toast.success("Customer updated");
        setEditing(false);
      } else {
        toast.error("Update failed", { description: result.error });
      }
    } catch (e) {
      toast.error("Update failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleDelete = async () => {
    if (!customerId) return;
    try {
      const result = await deleteMutation.mutateAsync(customerId);
      if (result.success) {
        toast.success("Customer deleted");
        setDeleteOpen(false);
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error("Delete failed", { description: result.error });
      }
    } catch (e) {
      toast.error("Delete failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 border-neutral-200/80 p-0 sm:max-w-md dark:border-neutral-800">
          <SheetHeader className="border-b border-neutral-100 px-6 py-5 text-left dark:border-neutral-800">
            <SheetTitle className="text-base font-semibold tracking-tight">
              {customer?.name ?? "Customer"}
            </SheetTitle>
            <SheetDescription>
              Profile, purchase history, and quick actions
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {detailQuery.isPending ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-neutral-400" />
              </div>
            ) : detailQuery.isError || !customer ? (
              <p className="text-sm text-red-600">Could not load customer.</p>
            ) : editing ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Full name</Label>
                  <Input
                    value={form.name ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Date of birth</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Allergies</Label>
                  <Input
                    value={form.allergies ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, allergies: e.target.value })
                    }
                  />
                </div>
                <CustomerInsuranceFields
                  provider={insuranceProvider}
                  memberNumber={insuranceMemberNumber}
                  onProviderChange={setInsuranceProvider}
                  onMemberNumberChange={setInsuranceMemberNumber}
                />
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status ?? "active"}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        status: v as "active" | "inactive",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-neutral-500">Phone</dt>
                    <dd className="font-medium">{customer.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-500">Email</dt>
                    <dd className="font-medium">{customer.email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-500">Date of birth</dt>
                    <dd className="font-medium">
                      {customer.dateOfBirth || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-500">Status</dt>
                    <dd className="font-medium capitalize">
                      {customer.status}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-neutral-500">Insurance</dt>
                    <dd className="font-medium">
                      {customer.insurance || "—"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-neutral-500">Allergies</dt>
                    <dd className="font-medium">
                      {customer.allergies || "None"}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-neutral-500">Lifetime spend</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {(customer.totalPurchases ?? 0).toLocaleString()} RWF
                    </dd>
                  </div>
                </dl>

                <Separator />

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Recent sales
                  </p>
                  {recentSales.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No sales linked to this phone or name yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {recentSales.map((sale) => (
                        <li key={sale.id}>
                          <DashboardListRow className="items-center py-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {sale.receiptNumber ?? "Sale"}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {sale.createdAt
                                  ? new Date(sale.createdAt).toLocaleString()
                                  : "—"}{" "}
                                · {sale.paymentMethod ?? "—"}
                              </p>
                            </div>
                            <span className="text-sm font-semibold tabular-nums">
                              {sale.totalAmount.toLocaleString()} RWF
                            </span>
                          </DashboardListRow>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {customer && (
            <div className="flex flex-col gap-2 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
              {editing ? (
                <div className="flex gap-2">
                  <DashboardButton
                    className="flex-1"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </DashboardButton>
                  <DashboardButton
                    tone="primary"
                    className="flex-1"
                    onClick={() => void handleSave()}
                    disabled={updateMutation.isPending}
                  >
                    Save changes
                  </DashboardButton>
                </div>
              ) : (
                <>
                  <DashboardButton tone="primary" className="w-full" asChild>
                    <Link href={`/pos?customerId=${customer.id}`}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Start sale in POS
                    </Link>
                  </DashboardButton>
                  <div className="flex gap-2">
                    <DashboardButton
                      className="flex-1"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Edit
                    </DashboardButton>
                    <DashboardButton
                      tone="destructive"
                      className="flex-1"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete
                    </DashboardButton>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DashboardAlertDialogContent>
          <DashboardAlertDialogHeader>
            <DashboardAlertDialogTitle>Delete customer?</DashboardAlertDialogTitle>
            <DashboardAlertDialogDescription>
              This removes {customer?.name ?? "this customer"} from your
              pharmacy. Past sales receipts are kept, but loyalty data may be
              removed.
            </DashboardAlertDialogDescription>
          </DashboardAlertDialogHeader>
          <DashboardAlertDialogActions
            cancelLabel="Cancel"
            confirmLabel="Delete"
            confirmTone="destructive"
            onCancel={() => setDeleteOpen(false)}
            onConfirm={() => void handleDelete()}
          />
        </DashboardAlertDialogContent>
      </AlertDialog>
    </>
  );
}
