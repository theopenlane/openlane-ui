'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../button/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select/select'
import { cn } from '../../lib/utils'

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100]

interface PaginationProps {
  currentPage: number
  totalPages?: number
  pageSize: number
  pageSizeOptions?: number[]
  hasNextPage?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, pageSize, pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS, hasNextPage, onPageChange, onPageSizeChange }) => {
  const hasKnownTotal = totalPages !== undefined
  const isPageCountPending = !hasKnownTotal && hasNextPage === undefined
  const isFirstPage = currentPage === 1
  const isLastPage = hasKnownTotal ? currentPage === totalPages : !hasNextPage

  const pageLabel = hasKnownTotal ? `Page ${currentPage} of ${totalPages}` : isLastPage ? `Page ${currentPage}` : `Page ${currentPage} of many`

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2 text-sm">
        <span id="rows-per-page-label">Rows per page</span>
        <Select value={pageSize.toString()} onValueChange={(val) => onPageSizeChange(Number(val))}>
          <SelectTrigger aria-labelledby="rows-per-page-label" className="w-[60px] h-8 text-sm bg-secondary">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <span className={cn('text-sm', isPageCountPending && 'invisible')}>{pageLabel}</span>
        <div className="flex gap-2">
          <Button type="button" className="h-6 w-6 !p-0" variant="outline" aria-label="First page" disabled={isFirstPage} onClick={() => onPageChange(1)}>
            <ChevronsLeft size={16} />
          </Button>
          <Button type="button" className="h-6 w-6 !p-0" variant="outline" aria-label="Previous page" disabled={isFirstPage} onClick={() => onPageChange(currentPage - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button type="button" className="h-6 w-6 !p-0" variant="outline" aria-label="Next page" disabled={isLastPage} onClick={() => onPageChange(currentPage + 1)}>
            <ChevronRight size={16} />
          </Button>
          {hasKnownTotal && (
            <Button type="button" className="h-6 w-6 !p-0" variant="outline" aria-label="Last page" disabled={isLastPage} onClick={() => onPageChange(totalPages)}>
              <ChevronsRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pagination
