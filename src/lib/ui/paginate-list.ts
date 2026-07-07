export function paginateList<T>(items: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) return items;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function listTotalPages(count: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(count / pageSize) || 1);
}
