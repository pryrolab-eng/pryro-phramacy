'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface TablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
  className?: string
}

/**
 * Reusable shadcn-based pagination bar for data tables.
 * Shows page numbers with ellipsis for large page counts.
 */
export function TablePagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null

  // Build the visible page numbers (max 5 shown)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | 'ellipsis')[] = [1]
    if (page > 3) pages.push('ellipsis')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={`flex flex-col items-center gap-2 sm:flex-row sm:justify-between ${className ?? ''}`}>
      {totalItems !== undefined && pageSize !== undefined ? (
        <p className="text-xs text-muted-foreground">
          Showing{' '}
          <span className="font-medium">
            {Math.min((page - 1) * pageSize + 1, totalItems)}–
            {Math.min(page * pageSize, totalItems)}
          </span>{' '}
          of <span className="font-medium">{totalItems}</span> results
        </p>
      ) : (
        <span />
      )}

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page > 1) onPageChange(page - 1)
            }}
            aria-disabled={page === 1}
            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
          />

          {pageNumbers.map((p, idx) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationLink
                key={p}
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(p)
                }}
              >
                {p}
              </PaginationLink>
            )
          )}

          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page < totalPages) onPageChange(page + 1)
            }}
            aria-disabled={page === totalPages}
            className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationContent>
      </Pagination>
    </div>
  )
}
