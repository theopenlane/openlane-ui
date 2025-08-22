'use client'

import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeDirection,
  ColumnResizeMode,
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
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../input/input'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu'
import { ArrowDown, ArrowUp, ArrowUpDown, EyeIcon } from 'lucide-react'
import { OrderDirection } from '@repo/codegen/src/schema.ts'
import Pagination from '../pagination/pagination'
import { TPagination, TPaginationMeta } from '../pagination/types'
import { cn } from '../../lib/utils'

type CustomColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  meta?: {
    className?: string
  }
}

type TStickyOption = { stickyHeader: true; stickyDialogHeader?: false } | { stickyHeader?: false; stickyDialogHeader: true } | { stickyHeader?: false; stickyDialogHeader?: false }

interface BaseDataTableProps<TData, TValue> {
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
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  footer?: ReactElement | null
}

type DataTableProps<TData, TValue> = BaseDataTableProps<TData, TValue> & TStickyOption

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
  setColumnVisibility,
  columnVisibility,
  footer,
  stickyHeader = false,
  stickyDialogHeader = false,
}: DataTableProps<TData, TValue>) {
  const [sortConditions, setSortConditions] = useState<{ field: string; direction?: OrderDirection }[]>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  const currentPage = pagination?.page || 1
  const currentPageSize = pagination?.pageSize || 10

  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({})

  const { totalCount, pageInfo, isLoading } = paginationMeta || {}

  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')

  const [columnResizeDirection] = useState<ColumnResizeDirection>('ltr')

  const totalPages = useMemo(() => {
    return totalCount ? Math.ceil(totalCount / currentPageSize) : 1
  }, [totalCount, currentPageSize])

  const handleSortChange = (field: string) => {
    setSortConditions((prev) => {
      const existingIndex = prev.findIndex((sc) => sc.field === field)
      const newSortConditions = [...prev]

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

  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)
  const [horizontalScrollbarHeight, setHorizontalScrollbarHeight] = useState(0)
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false)
  const [verticalScrollbarWidth, setVerticalScrollbarWidth] = useState(0)

  const checkScroll = () => {
    const scrollRefElement = scrollRef.current
    if (!scrollRefElement) return
    const { scrollLeft, scrollWidth, clientWidth, scrollHeight, clientHeight, offsetHeight, offsetWidth } = scrollRefElement
    const height = offsetHeight - clientHeight
    setHorizontalScrollbarHeight(height)
    setHasVerticalScroll(scrollHeight > clientHeight)
    setVerticalScrollbarWidth(offsetWidth - clientWidth)

    const difference = 1
    setShowLeftFade(scrollLeft > 0)
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - difference)
  }

  useEffect(() => {
    const scrollRefElement = scrollRef.current
    if (!scrollRefElement) return

    checkScroll()
    scrollRefElement.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      scrollRefElement.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [columnVisibility, pageInfo])

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
    if (sortConditions && sortConditions.length > 0 && sortConditions.every(({ direction }) => direction !== undefined)) {
      onSortChange?.(sortConditions as { field: string; direction: OrderDirection }[])
    }
  }, [onSortChange, sortConditions])

  return (
    <>
      <div className="relative">
        <div className={cn(`overflow-hidden rounded-lg border bg-background-secondary`, wrapperClass)}>
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
                    <Button icon={<EyeIcon />} iconPosition="left" variant="outline" size="md" className="ml-auto mr-2">
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
          <div className={cn(isLoading ? 'opacity-50 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300', 'relative overflow-x-auto')}>
            {showLeftFade && (
              <div
                className="absolute left-0 top-5 w-6 bg-gradient-to-r from-border to-transparent pointer-events-none z-10"
                style={{ bottom: horizontalScrollbarHeight ? `${horizontalScrollbarHeight}px` : '0' }}
              />
            )}
            {showRightFade && (
              <div
                className="absolute right-0 top-5 w-6 bg-gradient-to-l from-border to-transparent pointer-events-none z-10"
                style={{ bottom: horizontalScrollbarHeight ? `${horizontalScrollbarHeight}px` : '0', right: hasVerticalScroll ? `${verticalScrollbarWidth}px` : '0' }}
              />
            )}
            <Table ref={scrollRef} variant="data" stickyHeader={stickyHeader} stickyDialogHeader={stickyDialogHeader}>
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
                  <NoData loading={loading} columns={table.getAllLeafColumns()} noDataMarkup={noDataMarkup} noResultsText={noResultsText} />
                )}
              </TableBody>
            </Table>
          </div>
          {footer}
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

interface NoDataProps<TData, TValue> {
  loading: boolean
  columns: Column<TData, TValue>[]
  noDataMarkup?: React.ReactElement
  noResultsText: string
}

const NoData = <TData, TValue>({ loading, columns, noDataMarkup, noResultsText }: NoDataProps<TData, TValue>) => {
  const visibleCols = columns.filter((col) => col.getIsVisible())

  if (loading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, rowIndex) => (
          <TableRow key={rowIndex} variant="data">
            {visibleCols.map((col, colIndex) => (
              <TableCell key={colIndex} variant="data">
                <div className="animate-custom-pulse bg-white/20 rounded-lg h-[10px] w-full" style={{ width: `${col.getSize()}px` }} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    )
  }

  return (
    <TableRow variant="data">
      <TableCell variant="data" colSpan={visibleCols.length || 100} className="p-0">
        {noDataMarkup ? noDataMarkup : <div className="flex items-center justify-center w-full h-full p-5">No results</div>}
      </TableCell>
    </TableRow>
  )
}
