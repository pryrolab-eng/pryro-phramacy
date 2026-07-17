"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { DashboardButton } from "@/components/dashboard";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { POS_CATEGORY_CHIP_MAX, posSurfaces } from "@/components/pos/pos-tokens";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

type PosCategoryFilterProps = {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
};

/**
 * Few categories → one-tap chips.
 * Many (> POS_CATEGORY_CHIP_MAX) → searchable combobox.
 */
export function PosCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: PosCategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const useCombobox = categories.length > POS_CATEGORY_CHIP_MAX;

  if (!useCombobox) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={cn(
            posSurfaces.categoryChip,
            selectedCategory === "all" && posSurfaces.categoryChipActive,
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.name)}
            className={cn(
              posSurfaces.categoryChip,
              selectedCategory === cat.name && posSurfaces.categoryChipActive,
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    );
  }

  const label =
    selectedCategory === "all"
      ? "All categories"
      : selectedCategory || "All categories";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <DashboardButton
          tone="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full max-w-sm justify-between gap-2 px-3 font-normal"
        >
          <span className="truncate text-left text-sm">{label}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </DashboardButton>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search categories…" />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="All categories"
                onSelect={() => {
                  onCategoryChange("all");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    selectedCategory === "all" ? "opacity-100" : "opacity-0",
                  )}
                />
                All categories
              </CommandItem>
              {categories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.name}
                  onSelect={() => {
                    onCategoryChange(cat.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      selectedCategory === cat.name
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {cat.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
