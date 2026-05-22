'use client'

import { useState, useMemo } from 'react'

export interface UsePaginationOptions {
  pageSize?: number
}

export interface UsePaginationResult<T> {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  paginatedData: T[]
  setPage: (page: number) => void
  canPrevious: boolean
  canNext: boolean
}

/**
 * Generic client-side pagination hook.
 * Pass in the full data array and get back the current page slice + controls.
 */
export function useTablePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { pageSize = 10 } = options
  const [page, setPageRaw] = useState(1)

  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Clamp page when data shrinks
  const page_ = Math.min(page, totalPages)

  const paginatedData = useMemo(
    () => data.slice((page_ - 1) * pageSize, page_ * pageSize),
    [data, page_, pageSize]
  )

  const setPage = (p: number) => {
    setPageRaw(Math.max(1, Math.min(p, totalPages)))
  }

  return {
    page: page_,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setPage,
    canPrevious: page_ > 1,
    canNext: page_ < totalPages,
  }
}
