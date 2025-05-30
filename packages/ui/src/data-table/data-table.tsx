'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeDirection,
  ColumnResizeMode,
  ColumnSizing,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table/table'
import { Button } from '../button/button'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { Input } from '../input/input'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu'
import { ArrowDown, ArrowUp, ArrowUpDown, EyeIcon } from 'lucide-react'
import { OrderDirection } from '@repo/codegen/src/schema.ts'
import Pagination from '../pagination/pagination'
import { TPagination, TPaginationMeta } from '../pagination/types'
import { cn } from '../../lib/utils'
import { useSearchParams } from 'next/navigation'
import { Filter } from 'console/src/types'

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
  wrapperClass?: string
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
  wrapperClass,
}: DataTableProps<TData, TValue>) {
  const [sortConditions, setSortConditions] = useState<{ field: string; direction?: OrderDirection }[]>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const searchParams = useSearchParams()

  const currentPage = pagination?.page || 1
  const currentPageSize = pagination?.pageSize || 10

  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({})
  const [hasFilters, setHasFilters] = useState<boolean>(false)

  const { totalCount, pageInfo, isLoading } = paginationMeta || {}

  const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange')

  const [columnResizeDirection, setColumnResizeDirection] = useState<ColumnResizeDirection>('ltr')

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
    onColumnSizingChange: setColumnSizes,
    columnResizeMode,
    columnResizeDirection,

    enableColumnResizing: true,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing: columnSizes,
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

  useEffect(() => {
    const filtersParam = searchParams.get('filters')
    const parsedFilters: Filter[] | null = filtersParam ? JSON.parse(decodeURIComponent(filtersParam)) : null
    parsedFilters && parsedFilters?.filter((filter) => filter.value !== '').length > 0 ? setHasFilters(true) : setHasFilters(false)
  }, [searchParams])

  return (
    <>
      <div className={cn(`overflow-hidden rounded-lg border bg-background-secondary ${hasFilters ? 'mt-12' : ''}`, wrapperClass)}>
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
          <Table variant="data">
            <TableHeader variant="data">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow variant="data" key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const normalizeKey = (key: string) => key.replace(/_/g, '').toLowerCase()
                    const sortField = sortFields?.find((sf) => normalizeKey(sf.key) === normalizeKey(header.column.id))
                    const columnWidth = header.getSize() === 20 ? 'auto' : `${header.getSize()}px`

                    const sorting = sortConditions.find((sc) => sc.field === sortField?.key)?.direction || undefined
                    return (
                      <TableHead variant="data" key={`${header.id}-${index}`} style={{ position: 'relative', width: columnWidth }}>
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1" style={{ width: columnWidth }}>
                            {/* Sorting Area */}
                            <div onClick={() => sortField?.key && handleSortChange(sortField.key)} className="flex items-center gap-1 cursor-pointer select-none" style={{ flex: '1 1 auto' }}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sortField &&
                                (sorting === OrderDirection.ASC ? (
                                  <ArrowUp size={16} />
                                ) : sorting === OrderDirection.DESC ? (
                                  <ArrowDown size={16} />
                                ) : (
                                  <ArrowUpDown size={16} className="text-gray-400" />
                                ))}
                            </div>

                            {/* Resizing Area */}
                            {index < headerGroup.headers.length - 1 && (
                              <div
                                {...{
                                  onDoubleClick: () => header.column.resetSize(),
                                  onMouseDown: header.getResizeHandler(),
                                  onTouchStart: header.getResizeHandler(),
                                  className: `resizer ${table.options.columnResizeDirection} ${header.column.getIsResizing() ? 'isResizing' : ''}`,
                                  style: {
                                    transform:
                                      columnResizeMode === 'onEnd' && header.column.getIsResizing()
                                        ? `translateX(${(table.options.columnResizeDirection === 'rtl' ? -1 : 1) * (table.getState().columnSizingInfo.deltaOffset ?? 0)}px)`
                                        : '',
                                  },
                                }}
                              >
                                <div className="absolute right-0 top-0 bottom-0 cursor-col-resize w-[25%]">
                                  <div className="absolute right-0 top-0 bottom-0 w-[0.25px] bg-[var(--color-border)]" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody variant="data">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    variant="data"
                    onClick={() => onRowClick?.(row.original)}
                    className={`hover:bg-table-row-bg-hover ${onRowClick ? 'cursor-pointer' : ''}`}
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      // @ts-ignore
                      <TableCell variant="data" key={cell.id} className={cell.column.columnDef.meta?.className || ''}>
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
    <TableRow variant="data">
      <TableCell variant="data" colSpan={colLength} className="h-24 text-center">
        {loading ? 'Loading' : noResultsText}
      </TableCell>
    </TableRow>
  )
}
