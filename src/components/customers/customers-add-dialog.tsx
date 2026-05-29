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

const emptyForm: CreateCustomerInput = {
  name: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  allergies: "",
  insurance: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateCustomerInput) => Promise<void>;
  isPending?: boolean;
  trigger?: React.ReactNode;
};

export function CustomersAddDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  trigger,
}: Props) {
  const [form, setForm] = useState<CreateCustomerInput>(emptyForm);

  const reset = () => setForm(emptyForm);

  const handleSubmit = async () => {
    await onSubmit(form);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DashboardDialogContent className="sm:max-w-md">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Add customer</DashboardDialogTitle>
          <DashboardDialogDescription>
            Create a pharmacy customer for POS lookup and visit history.
          </DashboardDialogDescription>
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
          <div className="grid gap-2">
            <Label htmlFor="cust-insurance">Insurance / RSSB number</Label>
            <Input
              id="cust-insurance"
              placeholder="e.g. RSSB, MMI, Radiant"
              value={form.insurance ?? ""}
              onChange={(e) => setForm({ ...form, insurance: e.target.value })}
            />
          </div>
        </DashboardDialogBody>
        <DashboardDialogActions
          cancelLabel="Cancel"
          confirmLabel="Add customer"
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
}: {
  onClick?: () => void;
}) {
  return (
    <DashboardButton tone="primary" onClick={onClick}>
      <Plus className="mr-1.5 h-4 w-4" />
      Add customer
    </DashboardButton>
  );
}
