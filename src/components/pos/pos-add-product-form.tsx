"use client";

import { CategorySelect, type CategorySelectOption } from "@/components/catalog/category-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

export type PosAddProductFormProps = {
  category: string;
  onCategoryChange: (value: string) => void;
  categories: CategorySelectOption[];
  onCreateCategory: (
    name: string,
  ) => Promise<{ success: boolean; categoryId?: string; error?: string }>;
};

export function PosAddProductForm({
  category,
  onCategoryChange,
  categories,
  onCreateCategory,
}: PosAddProductFormProps) {
  return (
    <div className="space-y-6">
      <FormSection title="Product details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product code (SKU)" htmlFor="pos-product-code">
            <Input
              id="pos-product-code"
              name="productCode"
              placeholder="PAR500"
              autoComplete="off"
            />
          </Field>
          <Field label="Barcode" htmlFor="pos-product-barcode">
            <Input
              id="pos-product-barcode"
              name="barcode"
              placeholder="123456789"
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label="Product name" htmlFor="pos-product-name">
          <Input
            id="pos-product-name"
            name="productName"
            placeholder="Paracetamol 500mg"
            required
            autoComplete="off"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category / family">
            <CategorySelect
              value={category}
              onValueChange={onCategoryChange}
              categories={categories}
              onCreateCategory={onCreateCategory}
              placeholder="Select category"
              className="w-full"
            />
          </Field>
          <Field label="Classification code" htmlFor="pos-classification">
            <Input
              id="pos-classification"
              name="classificationCode"
              placeholder="N02BE01"
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label="Manufacturer / supplier" htmlFor="pos-manufacturer">
          <Input
            id="pos-manufacturer"
            name="manufacturer"
            placeholder="PharmaCorp Ltd"
            autoComplete="off"
          />
        </Field>
      </FormSection>

      <FormSection title="Pricing & stock">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Purchase price (RWF)" htmlFor="pos-purchase-price">
            <Input
              id="pos-purchase-price"
              name="purchasePrice"
              type="number"
              min={0}
              placeholder="400"
            />
          </Field>
          <Field label="Unit price (RWF)" htmlFor="pos-unit-price">
            <Input
              id="pos-unit-price"
              name="unitPrice"
              type="number"
              min={0}
              placeholder="500"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Initial stock" htmlFor="pos-initial-stock">
            <Input
              id="pos-initial-stock"
              name="initialStock"
              type="number"
              min={0}
              placeholder="100"
            />
          </Field>
          <Field label="Min stock alert" htmlFor="pos-min-stock">
            <Input
              id="pos-min-stock"
              name="minStockAlert"
              type="number"
              min={0}
              placeholder="20"
            />
          </Field>
          <Field label="Max stock (optional)" htmlFor="pos-max-stock">
            <Input
              id="pos-max-stock"
              name="maxStock"
              type="number"
              min={0}
              placeholder="500"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Batch & compliance">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Batch number" htmlFor="pos-batch">
            <Input id="pos-batch" name="batchNumber" placeholder="BAT001" />
          </Field>
          <Field label="Expiry date" htmlFor="pos-expiry">
            <Input id="pos-expiry" name="expiryDate" type="date" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="VAT rate">
            <Select name="vatRate">
              <SelectTrigger>
                <SelectValue placeholder="Select VAT rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Option A (18%)</SelectItem>
                <SelectItem value="B">Option B (0%)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Stock location">
            <Select name="stockLocation" defaultValue="main-store">
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main-store">Main store</SelectItem>
                <SelectItem value="branch">Branch</SelectItem>
                <SelectItem value="cold-storage">Cold storage</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
          <input
            type="checkbox"
            id="trackByBatch"
            name="trackByBatch"
            className="h-4 w-4 rounded border-neutral-300"
          />
          <Label htmlFor="trackByBatch" className="cursor-pointer font-normal">
            Track inventory by batch number
          </Label>
        </div>
        <Field label="Notes" htmlFor="pos-notes">
          <Input
            id="pos-notes"
            name="notes"
            placeholder="Special storage or handling instructions"
          />
        </Field>
      </FormSection>
    </div>
  );
}
