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
import type { CreateSaasBranchInput } from "@/lib/http/saas-branches";

const emptyForm: CreateSaasBranchInput = {
  name: "",
  address: "",
  phone: "",
  email: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateSaasBranchInput) => Promise<void>;
  isPending?: boolean;
  trigger?: React.ReactNode;
};

export function BranchAddDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  trigger,
}: Props) {
  const [form, setForm] = useState<CreateSaasBranchInput>(emptyForm);

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
          <DashboardDialogTitle>Add branch</DashboardDialogTitle>
          <DashboardDialogDescription>
            Add a satellite outlet. It starts with its own stock — receive drugs from
            Headquarters (HQ) using Inventory → Transfer. Plan limits apply per
            location each billing cycle.
          </DashboardDialogDescription>
        </DashboardDialogHeader>
        <DashboardDialogBody className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="branch-name">Branch name *</Label>
            <Input
              id="branch-name"
              placeholder="e.g. Remera Branch"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="branch-address">Address</Label>
            <Input
              id="branch-address"
              placeholder="Full address"
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="branch-phone">Phone</Label>
              <Input
                id="branch-phone"
                placeholder="+250788123456"
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="branch-email">Email</Label>
              <Input
                id="branch-email"
                placeholder="branch@pharmacy.com"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
        </DashboardDialogBody>
        <DashboardDialogActions
          cancelLabel="Cancel"
          confirmLabel="Create branch"
          onCancel={() => onOpenChange(false)}
          onConfirm={() => void handleSubmit()}
          confirmDisabled={!form.name.trim()}
          confirmLoading={isPending}
        />
      </DashboardDialogContent>
    </Dialog>
  );
}

export function BranchAddDialogTrigger({
  label = "Add branch",
}: {
  label?: string;
}) {
  return (
    <DashboardButton tone="primary">
      <Plus className="mr-1.5 h-4 w-4" />
      {label}
    </DashboardButton>
  );
}
