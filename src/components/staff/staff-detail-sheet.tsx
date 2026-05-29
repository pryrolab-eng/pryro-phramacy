"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, UserX, UserCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import {
  DashboardButton,
  AlertDialog,
  DashboardAlertDialogContent,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
  DashboardAlertDialogDescription,
  DashboardAlertDialogActions,
} from "@/components/dashboard";
import { StaffBranchAccessEditor } from "@/components/staff/staff-branch-access-editor";
import {
  useDeleteStaffMutation,
  useUpdateStaffMutation,
} from "@/hooks/useUsers";
import type { StaffUpdatePayload, StaffUser } from "@/lib/http/staff";
import { formatStaffRole } from "@/lib/staff/format-staff";

type Props = {
  member: StaffUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function StaffDetailSheet({
  member,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const updateMutation = useUpdateStaffMutation();
  const deleteMutation = useDeleteStaffMutation();

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<StaffUpdatePayload>({
    name: "",
    email: "",
    phone: "",
    role: "pharmacist",
    password: "",
    status: "active",
  });

  useEffect(() => {
    if (!member) return;
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone === "N/A" ? "" : member.phone,
      role: member.role,
      password: "",
      status: member.status === "inactive" ? "inactive" : "active",
    });
    setEditing(false);
  }, [member?.id, member]);

  const handleSave = async () => {
    if (!member?.id) return;
    try {
      await updateMutation.mutateAsync({
        id: member.id,
        body: {
          ...form,
          password: form.password?.trim() || undefined,
        },
      });
      toast.success("Staff member updated");
      setEditing(false);
    } catch (e) {
      toast.error("Update failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const toggleStatus = async () => {
    if (!member?.id) return;
    const next = member.status === "inactive" ? "active" : "inactive";
    try {
      await updateMutation.mutateAsync({
        id: member.id,
        body: {
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          status: next,
        },
      });
      toast.success(
        next === "active" ? "Staff member activated" : "Staff member deactivated",
      );
    } catch (e) {
      toast.error("Could not update status", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleDelete = async () => {
    if (!member?.id) return;
    try {
      await deleteMutation.mutateAsync(member.id);
      toast.success("Staff member removed");
      setDeleteOpen(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (e) {
      toast.error("Delete failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const isActive = member?.status !== "inactive";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 border-neutral-200/80 p-0 sm:max-w-md dark:border-neutral-800">
          <SheetHeader className="border-b border-neutral-100 px-6 py-5 text-left dark:border-neutral-800">
            <SheetTitle className="text-base font-semibold tracking-tight">
              {member?.name ?? "Staff member"}
            </SheetTitle>
            <SheetDescription>
              Role, contact details, and branch access
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {!member ? (
              <p className="text-sm text-neutral-500">Select a team member.</p>
            ) : editing ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Full name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
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
                  <Label>Status</Label>
                  <Select
                    value={form.status ?? "active"}
                    onValueChange={(status) =>
                      setForm({
                        ...form,
                        status: status as "active" | "inactive",
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
                <div className="grid gap-2">
                  <Label>New password (optional)</Label>
                  <PasswordInput
                    value={form.password ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <Separator />
                <StaffBranchAccessEditor
                  pharmacyUserId={member.id}
                  disabled={updateMutation.isPending}
                />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-neutral-500">Role</dt>
                  <dd className="font-medium">{formatStaffRole(member.role)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Status</dt>
                  <dd className="font-medium capitalize">{member.status}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-neutral-500">Email</dt>
                  <dd className="font-medium break-all">{member.email || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-neutral-500">Phone</dt>
                  <dd className="font-medium">
                    {member.phone && member.phone !== "N/A" ? member.phone : "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-neutral-500">Joined</dt>
                  <dd className="font-medium">{member.joinDate || "—"}</dd>
                </div>
              </dl>
            )}
          </div>

          {member && (
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
                  <DashboardButton
                    className="w-full"
                    onClick={() => void toggleStatus()}
                    disabled={updateMutation.isPending}
                  >
                    {isActive ? (
                      <>
                        <UserX className="mr-1.5 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-1.5 h-4 w-4" />
                        Activate
                      </>
                    )}
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
                      Remove
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
            <DashboardAlertDialogTitle>
              Remove staff member?
            </DashboardAlertDialogTitle>
            <DashboardAlertDialogDescription>
              {member?.name ?? "This person"} will lose access to this pharmacy.
              Their auth account may still exist.
            </DashboardAlertDialogDescription>
          </DashboardAlertDialogHeader>
          <DashboardAlertDialogActions
            cancelLabel="Cancel"
            confirmLabel="Remove"
            confirmTone="destructive"
            onCancel={() => setDeleteOpen(false)}
            onConfirm={() => void handleDelete()}
          />
        </DashboardAlertDialogContent>
      </AlertDialog>
    </>
  );
}
