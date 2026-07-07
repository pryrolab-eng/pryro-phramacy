"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { paginateList } from "@/lib/ui/paginate-list";
import { cn } from "@/lib/utils";
import { DashboardListFooterPagination } from "./dashboard-list-footer-pagination";
import { DashboardPanelEmpty } from "./dashboard-panel-empty";
import { DashboardSectionCard } from "./dashboard-section-card";

type EmptyState = {
  icon?: LucideIcon;
  title: string;
  description?: string;
};

type Props<T> = {
  title: string;
  description?: string;
  action?: ReactNode;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  empty?: EmptyState;
  pageSize?: number;
  pageSizeOptions?: number[];
  /** When visible rows exceed this, content scrolls inside maxScrollHeight. */
  scrollAfterRows?: number;
  maxScrollHeight?: number;
  className?: string;
  contentClassName?: string;
  showCountBadge?: boolean;
};

const DEFAULT_PAGE_SIZE = 5;

export function DashboardPaginatedListCard<T>({
  title,
  description,
  action,
  items,
  renderItem,
  getItemKey,
  empty,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = [5, 8, 12],
  scrollAfterRows = 6,
  maxScrollHeight = 280,
  className,
  contentClassName,
  showCountBadge = true,
}: Props<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [totalItems, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => paginateList(items, page, pageSize),
    [items, page, pageSize],
  );

  const showPagination = totalItems > pageSize;
  const useScroll = pageItems.length >= scrollAfterRows;

  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      {showCountBadge && totalItems > 0 ? (
        <Badge variant="secondary" className="tabular-nums">
          {totalItems}
        </Badge>
      ) : null}
      {action}
    </div>
  );

  const listBody = (
    <div className="space-y-3">
      {pageItems.map((item, index) => (
        <div key={getItemKey(item, index)}>{renderItem(item, index)}</div>
      ))}
    </div>
  );

  return (
    <DashboardSectionCard
      title={title}
      description={description}
      action={headerAction}
      className={cn("flex h-auto flex-col", className)}
      contentClassName={cn("flex min-h-0 flex-1 flex-col", contentClassName)}
    >
      {totalItems === 0 && empty ? (
        <DashboardPanelEmpty
          icon={empty.icon ?? Inbox}
          title={empty.title}
          description={empty.description ?? ""}
          className="min-h-[120px] border-0 bg-transparent py-6 shadow-none"
        />
      ) : useScroll ? (
        <ScrollArea className="min-h-0 w-full" style={{ maxHeight: maxScrollHeight }}>
          <div className="pr-3">{listBody}</div>
        </ScrollArea>
      ) : (
        listBody
      )}

      {showPagination ? (
        <DashboardListFooterPagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={pageSizeOptions}
        />
      ) : null}
    </DashboardSectionCard>
  );
}
