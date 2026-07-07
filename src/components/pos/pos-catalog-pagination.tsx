"use client";

import { DashboardButton } from "@/components/dashboard";
import {
  POS_CATALOG_PAGE_SIZES,
  posSurfaces,
} from "@/components/pos/pos-tokens";

type Props = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function PosCatalogPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  return (
    <div className={posSurfaces.catalogFooter}>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        {totalItems === 0
          ? "No products"
          : `Showing ${start}–${end} of ${totalItems.toLocaleString()}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="sr-only">Per page</span>
            <select
              className="h-8 rounded-md border border-neutral-200/80 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Products per page"
            >
              {POS_CATALOG_PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <DashboardButton
          size="sm"
          tone="outline"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </DashboardButton>
        <span className="min-w-[5.5rem] text-center text-xs font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
          {safePage} / {totalPages}
        </span>
        <DashboardButton
          size="sm"
          tone="outline"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </DashboardButton>
      </div>
    </div>
  );
}

export { paginateList } from "@/lib/ui/paginate-list";
