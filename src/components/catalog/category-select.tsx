"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DashboardButton,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogFooter,
  DashboardDialogHeader,
  DashboardDialogTitle,
} from "@/components/dashboard";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encodeCategoryCatalogValue } from "@/lib/db/medication-category-ref";
import type { CategoryCatalogItem } from "@/lib/pharmacy/category-catalog";

const CREATE_VALUE = "__create_category__";

export type CategorySelectOption = Pick<CategoryCatalogItem, "id" | "name" | "scope">;

export type CategorySelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  categories: CategorySelectOption[];
  onCreateCategory: (
    name: string,
  ) => Promise<{ success: boolean; categoryId?: string; error?: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function optionValue(category: CategorySelectOption): string {
  return encodeCategoryCatalogValue(category);
}

export function CategorySelect({
  value,
  onValueChange,
  categories,
  onCreateCategory,
  placeholder = "Select category",
  disabled,
  className,
}: CategorySelectProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSelect = (next: string) => {
    if (next === CREATE_VALUE) {
      setCreateError(null);
      setNewName("");
      setCreateOpen(true);
      return;
    }
    onValueChange(next);
  };

  const submitNewCategory = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await onCreateCategory(trimmed);
      if (!result.success || !result.categoryId) {
        setCreateError(result.error ?? "Failed to add category");
        return;
      }
      onValueChange(
        encodeCategoryCatalogValue({ scope: "pharmacy", id: result.categoryId }),
      );
      setCreateOpen(false);
      setNewName("");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to add category",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Select
        value={value || undefined}
        onValueChange={handleSelect}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories.length === 0 ? (
            <SelectItem value={CREATE_VALUE} className="text-primary">
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add category…
              </span>
            </SelectItem>
          ) : (
            <>
              {categories.map((category) => (
                <SelectItem key={`${category.scope}:${category.id}`} value={optionValue(category)}>
                  {category.name}
                  {category.scope === "global" ? " (Global)" : null}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={CREATE_VALUE} className="text-primary">
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add category…
                </span>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DashboardDialogContent>
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add category</DashboardDialogTitle>
            <DashboardDialogDescription>
              Create a category for this pharmacy. It will appear in product
              forms right away.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-2">
            <Label htmlFor="new-category-name">Category name</Label>
            <Input
              id="new-category-name"
              placeholder="e.g. Supplements"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitNewCategory();
                }
              }}
            />
            {createError ? (
              <p className="text-sm text-destructive">{createError}</p>
            ) : null}
          </DashboardDialogBody>
          <DashboardDialogFooter>
            <DashboardButton
              type="button"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </DashboardButton>
            <DashboardButton
              type="button"
              tone="primary"
              disabled={!newName.trim() || creating}
              onClick={() => void submitNewCategory()}
            >
              {creating ? "Saving…" : "Add category"}
            </DashboardButton>
          </DashboardDialogFooter>
        </DashboardDialogContent>
      </Dialog>
    </>
  );
}
