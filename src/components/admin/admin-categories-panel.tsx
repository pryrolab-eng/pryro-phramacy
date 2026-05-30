"use client";

import { useMemo, useState } from "react";
import { Layers, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  createAdminCategoriesColumns,
  type AdminCategoryTableRow,
} from "@/components/admin/admin-categories-columns";
import {
  DashboardButton,
  DashboardDataTable,
  DashboardDialogActions,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardMetricGrid,
  DashboardPageLoading,
  DashboardStatCard,
} from "@/components/dashboard";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  DashboardAlertDialogActions,
  DashboardAlertDialogContent,
  DashboardAlertDialogDescription,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
} from "@/components/dashboard";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminCategories,
  useCreateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
} from "@/hooks/useAdminCategories";

const emptyForm = () => ({ name: "", description: "" });

function toTableRow(c: {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}): AdminCategoryTableRow {
  return {
    id: c.id,
    name: c.name,
    description: (c.description as string) || "",
    status: c.is_active !== false ? "Active" : "Inactive",
  };
}

export function AdminCategoriesPanel() {
  const categoriesQuery = useAdminCategories();
  const createMutation = useCreateAdminCategoryMutation();
  const updateMutation = useUpdateAdminCategoryMutation();
  const deleteMutation = useDeleteAdminCategoryMutation();

  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryTableRow | null>(
    null,
  );
  const [newCategory, setNewCategory] = useState(emptyForm);
  const [editCategory, setEditCategory] = useState<AdminCategoryTableRow | null>(
    null,
  );

  const rows = useMemo(
    () => (categoriesQuery.data ?? []).map(toTableRow),
    [categoriesQuery.data],
  );

  const activeCount = rows.filter((r) => r.status === "Active").length;
  const inactiveCount = rows.length - activeCount;

  const columns = useMemo(
    () =>
      createAdminCategoriesColumns({
        onEdit: (row) => {
          setEditCategory({ ...row });
          setIsEditOpen(true);
        },
        onDelete: (row) => setDeleteTarget(row),
      }),
    [],
  );

  const handleAdd = async () => {
    try {
      await createMutation.mutateAsync({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
      });
      setIsAddOpen(false);
      setNewCategory(emptyForm());
      toast.success("Global category added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add category",
      );
    }
  };

  const handleEdit = async () => {
    if (!editCategory) return;
    try {
      await updateMutation.mutateAsync({
        id: editCategory.id,
        body: {
          name: editCategory.name.trim(),
          description: editCategory.description.trim(),
          status: editCategory.status,
        },
      });
      setIsEditOpen(false);
      setEditCategory(null);
      toast.success("Category updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Category deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      );
    }
  };

  if (categoriesQuery.isLoading) {
    return <DashboardPageLoading label="Loading categories…" />;
  }

  return (
    <>
      <AdminPageHeader
        pinTitle="Categories"
        title={
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Global categories
          </h1>
        }
        description={
          <>
            Product group names shared with every pharmacy — used in POS filters
            and inventory when classifying stock.
            {categoriesQuery.isError ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {categoriesQuery.error instanceof Error
                  ? categoriesQuery.error.message
                  : "Could not load categories."}
              </p>
            ) : null}
          </>
        }
        actions={
          <DashboardButton tone="primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add category
          </DashboardButton>
        }
      />

      <DashboardMetricGrid className="mb-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Total"
          icon={Layers}
          value={rows.length}
        />
        <DashboardStatCard
          label="Active"
          icon={ToggleRight}
          value={activeCount}
        />
        <DashboardStatCard
          label="Inactive"
          icon={ToggleLeft}
          value={inactiveCount}
        />
      </DashboardMetricGrid>

      <DashboardDataTable
        title="Category catalog"
        description="Inactive categories stay in the database but are hidden from pharmacy POS and inventory pickers."
        searchPlaceholder="Search name or description…"
        searchValue={search}
        onSearchChange={setSearch}
        columns={columns}
        data={rows}
        pageSize={15}
        pageSizeOptions={[10, 15, 25, 50]}
        stickyHeader
        initialSorting={[{ id: "name", desc: false }]}
        emptyMessage="No global categories yet. Add one to standardize POS filters across pharmacies."
        isLoading={categoriesQuery.isFetching && rows.length === 0}
        error={
          categoriesQuery.isError
            ? categoriesQuery.error instanceof Error
              ? categoriesQuery.error.message
              : "Failed to load categories"
            : null
        }
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add global category</DashboardDialogTitle>
            <DashboardDialogDescription>
              Pharmacies will see this in POS category chips and inventory
              forms. They can still add their own local categories.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Antibiotics"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                placeholder="Optional"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Add category"
            onCancel={() => {
              setIsAddOpen(false);
              setNewCategory(emptyForm());
            }}
            onConfirm={() => void handleAdd()}
            confirmDisabled={!newCategory.name.trim()}
            confirmLoading={createMutation.isPending}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DashboardDialogContent className="sm:max-w-md">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Edit category</DashboardDialogTitle>
          </DashboardDialogHeader>
          {editCategory ? (
            <>
              <DashboardDialogBody className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-cat-name">Name</Label>
                  <Input
                    id="edit-cat-name"
                    value={editCategory.name}
                    onChange={(e) =>
                      setEditCategory({
                        ...editCategory,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-cat-desc">Description</Label>
                  <Textarea
                    id="edit-cat-desc"
                    value={editCategory.description}
                    onChange={(e) =>
                      setEditCategory({
                        ...editCategory,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={editCategory.status}
                    onValueChange={(value: "Active" | "Inactive") =>
                      setEditCategory({ ...editCategory, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DashboardDialogBody>
              <DashboardDialogActions
                cancelLabel="Cancel"
                confirmLabel="Save"
                onCancel={() => {
                  setIsEditOpen(false);
                  setEditCategory(null);
                }}
                onConfirm={() => void handleEdit()}
                confirmDisabled={!editCategory.name.trim()}
                confirmLoading={updateMutation.isPending}
              />
            </>
          ) : null}
        </DashboardDialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DashboardAlertDialogContent>
          <DashboardAlertDialogHeader>
            <DashboardAlertDialogTitle>Delete category?</DashboardAlertDialogTitle>
            <DashboardAlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be removed for all pharmacies. Products already tagged with this name are not changed.`
                : null}
            </DashboardAlertDialogDescription>
          </DashboardAlertDialogHeader>
          <DashboardAlertDialogActions
            cancelLabel="Cancel"
            confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
            confirmTone="destructive"
            onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
            onConfirm={() => void handleDelete()}
            confirmDisabled={deleteMutation.isPending}
          />
        </DashboardAlertDialogContent>
      </AlertDialog>
    </>
  );
}
