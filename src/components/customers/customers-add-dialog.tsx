"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
  DashboardButton,
} from "@/components/dashboard";
import type { CreateCustomerInput } from "@/lib/http/customers";
import {
  buildCustomerInsuranceValue,
  CustomerInsuranceFields,
} from "@/components/customers/customer-insurance-fields";

type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  allergies: string;
  insuranceProvider: string;
  insuranceMemberNumber: string;
};

const emptyForm: CustomerFormState = {
  name: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  allergies: "",
  insuranceProvider: "",
  insuranceMemberNumber: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateCustomerInput) => Promise<void>;
  isPending?: boolean;
  trigger?: React.ReactNode;
  /** Override dialog copy (e.g. patients page). */
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export function CustomersAddDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  trigger,
  title = "Add customer",
  description = "Create a pharmacy customer for POS lookup and visit history.",
  confirmLabel = "Add customer",
}: Props) {
  const [form, setForm] = useState<CustomerFormState>(emptyForm);

  const reset = () => setForm(emptyForm);

  const handleSubmit = async () => {
    const payload: CreateCustomerInput = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      dateOfBirth: form.dateOfBirth,
      allergies: form.allergies,
      insurance: buildCustomerInsuranceValue(
        form.insuranceProvider ?? "",
        form.insuranceMemberNumber ?? "",
      ),
    };
    await onSubmit(payload);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setForm((prev) => ({
            ...emptyForm,
            ...prev,
            insuranceProvider: prev.insuranceProvider ?? "",
            insuranceMemberNumber: prev.insuranceMemberNumber ?? "",
          }));
        } else {
          reset();
        }
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DashboardDialogContent className="sm:max-w-md">
        <DashboardDialogHeader>
          <DashboardDialogTitle>{title}</DashboardDialogTitle>
          <DashboardDialogDescription>{description}</DashboardDialogDescription>
        </DashboardDialogHeader>
        <DashboardDialogBody className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cust-name">Full name</Label>
            <Input
              id="cust-name"
              placeholder="e.g. Marie Uwimana"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cust-phone">Phone</Label>
            <Input
              id="cust-phone"
              placeholder="+250 788 123 456"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                placeholder="optional"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cust-dob">Date of birth</Label>
              <Input
                id="cust-dob"
                type="date"
                value={form.dateOfBirth ?? ""}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cust-allergies">Known allergies</Label>
            <Input
              id="cust-allergies"
              placeholder="e.g. Penicillin — or leave blank"
              value={form.allergies ?? ""}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            />
          </div>
          <CustomerInsuranceFields
            provider={form.insuranceProvider}
            memberNumber={form.insuranceMemberNumber}
            onProviderChange={(insuranceProvider) =>
              setForm({ ...form, insuranceProvider })
            }
            onMemberNumberChange={(insuranceMemberNumber) =>
              setForm({ ...form, insuranceMemberNumber })
            }
          />
        </DashboardDialogBody>
        <DashboardDialogActions
          cancelLabel="Cancel"
          confirmLabel={confirmLabel}
          onCancel={() => onOpenChange(false)}
          onConfirm={() => void handleSubmit()}
          confirmDisabled={!form.name.trim() || !form.phone.trim()}
          confirmLoading={isPending}
        />
      </DashboardDialogContent>
    </Dialog>
  );
}

export function CustomersAddDialogTrigger({
  onClick,
  label = "Add customer",
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <DashboardButton tone="primary" onClick={onClick}>
      <Plus className="mr-1.5 h-4 w-4" />
      {label}
    </DashboardButton>
  );
}
