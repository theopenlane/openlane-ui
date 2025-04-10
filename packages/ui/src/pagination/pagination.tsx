'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '../button/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select/select'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange }) => {
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  return (
    <div className="flex items-center gap-4 p-4 justify-end">
      <div className="flex items-center gap-2 text-sm">
        <span>Rows per page</span>
        <Select value={pageSize.toString()} onValueChange={(val) => onPageSizeChange(Number(val))}>
          <SelectTrigger className="w-[80px] h-8 text-sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 25, 50, 100].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button className="h-6 w-6 !p-0" variant="outline" disabled={isFirstPage} onClick={() => onPageChange(1)}>
          <ChevronsLeft size={16} />
        </Button>
        <Button className="h-6 w-6 !p-0" variant="outline" disabled={isFirstPage} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft size={16} />
        </Button>
        <Button className="h-6 w-6 !p-0" variant="outline" disabled={isLastPage} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight size={16} />
        </Button>
        <Button className="h-6 w-6 !p-0" variant="outline" disabled={isLastPage} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
