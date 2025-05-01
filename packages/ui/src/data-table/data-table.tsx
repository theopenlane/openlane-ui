'use client'

import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, VisibilityState } from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table/table'
import { Button } from '../button/button'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { Input } from '../input/input'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu'
import { ArrowDown, ArrowUp, ArrowUpDown, EyeIcon } from 'lucide-react'
import { OrderDirection } from '@repo/codegen/src/schema.ts'
import Pagination from '../pagination/pagination'
import { TPagination, TPaginationMeta } from '../pagination/types'

type CustomColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  meta?: {
    className?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: CustomColumnDef<TData, TValue>[]
  loading?: boolean
  data: TData[]
  showFilter?: boolean
  showVisibility?: boolean
  noResultsText?: string
  noDataMarkup?: ReactElement
  onRowClick?: (rowData: TData) => void
  sortFields?: { key: string; label: string; default?: { key: string; direction: OrderDirection } }[]
  onSortChange?: (sortCondition: any[]) => void
  pagination?: TPagination | null
  onPaginationChange?: (arg: TPagination) => void
  paginationMeta?: TPaginationMeta
}

export function DataTable<TData, TValue>({
  columns,
  loading = false,
  data,
  showFilter = false,
  showVisibility = false,
  noResultsText = 'No results',
  noDataMarkup,
  onRowClick,
  sortFields,
  onSortChange,
  pagination,
  onPaginationChange,
  paginationMeta,
}: DataTableProps<TData, TValue>) {
  const [sortConditions, setSortConditions] = useState<{ field: string; direction?: OrderDirection }[]>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const currentPage = pagination?.page || 1
  const currentPageSize = pagination?.pageSize || 10

  const { totalCount, pageInfo, isLoading } = paginationMeta || {}

  const totalPages = useMemo(() => {
    return totalCount ? Math.ceil(totalCount / currentPageSize) : 1
  }, [totalCount, currentPageSize])

  const handleSortChange = (field: string) => {
    setSortConditions((prev) => {
      const existingIndex = prev.findIndex((sc) => sc.field === field)
      let newSortConditions = [...prev]

      if (existingIndex === -1) {
        newSortConditions.push({ field, direction: OrderDirection.ASC })
      } else if (newSortConditions[existingIndex].direction === OrderDirection.ASC) {
        newSortConditions[existingIndex] = { field, direction: OrderDirection.DESC }
      } else {
        newSortConditions.splice(existingIndex, 1)
      }

      return newSortConditions
    })
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageSize: pagination?.pageSize || 10,
        pageIndex: 0,
      },
    },
    defaultColumn: {
      size: 0,
    },
  })

  const setNewPagination = (newPage: number, query: TPagination['query']) => {
    if (!pagination) {
      return
    }

    const newPagination: TPagination = {
      ...pagination,
      page: newPage,
      query,
    }
    onPaginationChange?.(newPagination)
  }

  const handlePageSizeChange = (newSize: number) => {
    if (!pagination) {
      return
    }
    const newPagination: TPagination = {
      ...pagination,
      page: 1,
      pageSize: newSize,
      query: { first: newSize },
    }
    onPaginationChange?.(newPagination)
  }

  const goToFirstPage = () => {
    setNewPagination(1, { first: currentPageSize })
  }

  const goToLastPage = () => {
    if (!pagination || !totalCount) return

    const totalPages = Math.ceil(totalCount / currentPageSize)
    const itemsBeforeLastPage = currentPageSize * (totalPages - 1)
    const remainingItems = totalCount - itemsBeforeLastPage

    const query = {
      last: remainingItems,
    }

    setNewPagination(totalPages, query)
  }

  const handlePageChange = (newPage: number) => {
    if (!pagination || !totalCount) return

    const totalPages = Math.ceil(totalCount / currentPageSize)

    if (newPage === 1) {
      goToFirstPage()
      return
    }

    if (newPage === totalPages) {
      goToLastPage()
      return
    }

    const isForward = newPage > currentPage

    const query = isForward ? { first: currentPageSize, after: pageInfo?.endCursor ?? null } : { last: currentPageSize, before: pageInfo?.startCursor ?? null }
    setNewPagination(newPage, query)
  }

  useEffect(() => {
    if (!sortFields) {
      return
    }

    const defaultField = sortFields.find((field) => field.default)
    if (!defaultField) {
      return
    }

    setSortConditions((prev) => {
      if (prev.some((cond) => cond.field === defaultField.key)) {
        return prev
      }

      return [
        ...prev,
        {
          field: defaultField.key,
          direction: defaultField.default?.direction,
        },
      ]
    })
  }, [sortFields])

  useEffect(() => {
    if (sortConditions.every(({ direction }) => direction !== undefined)) {
      onSortChange?.(sortConditions as { field: string; direction: OrderDirection }[])
    }
  }, [sortConditions])

  return (
    <>
      <div className="overflow-hidden rounded-md border bg-background-secondary">
        {(showFilter || showVisibility) && (
          <div className="flex items-center py-4">
            {showFilter && (
              <Input
                placeholder="Filter by name..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
                className="max-w-sm"
              />
            )}
            {showVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="md" className="ml-auto">
                    <EyeIcon />
                    Visibility
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column, index) => (
                      <DropdownMenuCheckboxItem key={`${column.id}-${index}`} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Apply opacity and disable interactions while loading */}
        <div className={isLoading ? 'opacity-50 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const normalizeKey = (key: string) => key.replace(/_/g, '').toLowerCase()
                    const sortField = sortFields?.find((sf) => normalizeKey(sf.key) === normalizeKey(header.column.id))
                    const columnWidth = header.getSize() === 20 ? 'auto' : `${header.getSize()}px`

                    if (!sortField) {
                      return (
                        <TableHead key={`${header.id}-${index}`} style={{ width: columnWidth }}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    }

                    const sorting = sortConditions.find((sc) => sc.field === sortField.key)?.direction
                    return (
                      <TableHead key={`${header.id}-${index}`} style={{ width: columnWidth, cursor: 'pointer' }} onClick={() => handleSortChange(sortField.key)}>
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1" style={{ width: columnWidth }}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorting === OrderDirection.ASC ? <ArrowUp size={16} /> : sorting === OrderDirection.DESC ? <ArrowDown size={16} /> : <ArrowUpDown size={16} className="text-gray-400" />}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    onClick={() => onRowClick?.(row.original)}
                    className={`hover:bg-table-row-bg-hover ${onRowClick ? 'cursor-pointer' : ''}`}
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      // @ts-ignore
                      <TableCell key={cell.id} className={cell.column.columnDef.meta?.className || ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <NoData loading={loading} colLength={columns.length} noDataMarkup={noDataMarkup} noResultsText={noResultsText} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination also gets opacity and interaction block on loading */}
      {pagination && (
        <div className={isLoading ? 'opacity-50 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
          <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={currentPageSize} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
        </div>
      )}
    </>
  )
}

interface NoDataProps {
  loading: boolean
  colLength: number
  noDataMarkup?: ReactElement
  noResultsText: string
}

const NoData = ({ loading, colLength, noDataMarkup, noResultsText }: NoDataProps) => {
  if (!loading && noDataMarkup) {
    return noDataMarkup
  }

  return (
    <TableRow>
      <TableCell colSpan={colLength} className="h-24 text-center">
        {loading ? 'Loading' : noResultsText}
      </TableCell>
    </TableRow>
  )
}
