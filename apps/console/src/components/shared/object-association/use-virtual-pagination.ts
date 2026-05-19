import { type Dispatch, type SetStateAction, useEffect, useMemo } from 'react'
import { type TPageInfo, type TPagination, type TPaginationQuery } from '@repo/ui/pagination-types'
import { type TableRow } from '@/components/shared/object-association/object-association-config'

type Args = {
  pinnedActive: boolean
  pinnedRows: TableRow[]
  tableData: TableRow[]
  pageInfo: TPageInfo | undefined
  totalCount: number | undefined
  pagination: TPagination
  setPagination: Dispatch<SetStateAction<TPagination>>
}

export const useVirtualPagination = ({ pinnedActive, pinnedRows, tableData, pageInfo, totalCount, pagination, setPagination }: Args) => {
  const { pageSize, page } = pagination
  const pinnedCount = pinnedActive ? pinnedRows.length : 0
  const pinnedPages = pinnedCount > 0 ? Math.ceil(pinnedCount / pageSize) : 0
  const pinnedTail = pinnedCount % pageSize
  const gap = pinnedTail > 0 ? pageSize - pinnedTail : 0

  const isBoundaryPage = gap > 0 && page === pinnedPages
  const isUnpinnedPage = !pinnedActive || page > pinnedPages

  const pageData = useMemo<TableRow[]>(() => {
    if (isUnpinnedPage) return tableData
    const start = (page - 1) * pageSize
    const pinnedSlice = pinnedRows.slice(start, start + pageSize)
    return isBoundaryPage ? [...pinnedSlice, ...tableData.slice(0, gap)] : pinnedSlice
  }, [isUnpinnedPage, isBoundaryPage, page, pageSize, pinnedRows, tableData, gap])

  useEffect(() => {
    if (!isBoundaryPage) return
    setPagination((prev) => (prev.query.first === gap && !prev.query.after && !prev.query.last && !prev.query.before ? prev : { ...prev, query: { first: gap } }))
  }, [isBoundaryPage, gap, setPagination])

  const remainingUnpinned = Math.max(0, (totalCount ?? 0) - gap)
  const totalPages = Math.max(1, pinnedPages + Math.ceil(remainingUnpinned / pageSize))

  const queryForPage = (newPage: number): TPaginationQuery | null => {
    const isBoundary = gap > 0 && newPage === pinnedPages
    if (pinnedActive && newPage <= pinnedPages && !isBoundary) return null
    if (isBoundary) return { first: gap }

    const isLast = newPage === totalPages && newPage > pinnedPages
    if (isLast && totalCount !== undefined) {
      return { last: remainingUnpinned % pageSize || pageSize }
    }

    const enteringUnpinned = pinnedActive && page <= pinnedPages
    if (enteringUnpinned) {
      const anchor = gap > 0 ? pageInfo?.endCursor : null
      return anchor ? { first: pageSize, after: anchor } : { first: pageSize }
    }

    if (newPage === 1) return { first: pageSize }

    return newPage > page ? { first: pageSize, after: pageInfo?.endCursor ?? null } : { last: pageSize, before: pageInfo?.startCursor ?? null }
  }

  const handlePageChange = (newPage: number) => {
    const query = queryForPage(newPage)
    setPagination(query === null ? { ...pagination, page: newPage } : { ...pagination, page: newPage, query })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPagination({ page: 1, pageSize: newSize, query: { first: newSize } })
  }

  return { pageData, totalPages, handlePageChange, handlePageSizeChange }
}
