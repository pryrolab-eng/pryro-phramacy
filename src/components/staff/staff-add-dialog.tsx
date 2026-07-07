"use client";

import { useState } from "react";
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
import {
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
} from "@/components/dashboard";

export type StaffInviteInput = {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
};

const emptyForm: StaffInviteInput = {
  name: "",
  email: "",
  phone: "",
  role: "pharmacist",
  password: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: StaffInviteInput) => Promise<void>;
  isPending?: boolean;
};

export function StaffAddDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: Props) {
  const [form, setForm] = useState<StaffInviteInput>(emptyForm);

  const reset = () => setForm(emptyForm);

  const handleSubmit = async () => {
    try {
      await onSubmit(form);
      reset();
      onOpenChange(false);
    } catch {
      // Parent shows toast; keep dialog open so the user can fix input.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DashboardDialogContent className="sm:max-w-md">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Invite staff member</DashboardDialogTitle>
          <DashboardDialogDescription>
            We email login instructions to the address below. Leave password
            blank to generate one automatically.
          </DashboardDialogDescription>
        </DashboardDialogHeader>
        <DashboardDialogBody className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="staff-name">Full name</Label>
            <Input
              id="staff-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-phone">Phone</Label>
            <Input
              id="staff-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(role) => setForm({ ...form, role })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-password">Password (optional)</Label>
            <PasswordInput
              id="staff-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Auto-generated and emailed if empty"
            />
          </div>
        </DashboardDialogBody>
        <DashboardDialogActions
          cancelLabel="Cancel"
          confirmLabel="Send invitation"
          onCancel={() => onOpenChange(false)}
          onConfirm={() => void handleSubmit()}
          confirmDisabled={!form.email.trim() || !form.name.trim()}
          confirmLoading={isPending}
        />
      </DashboardDialogContent>
    </Dialog>
  );
}
