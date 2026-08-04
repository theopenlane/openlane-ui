import { type TPagination } from '@repo/ui/pagination-types'

export const sliceByPagination = <T>(items: T[], pagination: TPagination): T[] => {
  const start = Math.max(0, (pagination.page - 1) * pagination.pageSize)
  return items.slice(start, start + pagination.pageSize)
}
