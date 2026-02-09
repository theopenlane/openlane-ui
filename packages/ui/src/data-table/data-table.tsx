'use client'

import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeDirection,
  ColumnResizeMode,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  Row,
  Table as TanstackTable,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table/table'
import { Button } from '../button/button'
import { memo, ReactElement, type CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../input/input'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu'
import { ArrowDown, ArrowUp, ArrowUpDown, EyeIcon } from 'lucide-react'
import { OrderDirection } from '@repo/codegen/src/schema.ts'
import Pagination from '../pagination/pagination'
import { TPagination, TPaginationMeta } from '../pagination/types'
import { cn } from '../../lib/utils'
import { TableKeyEnum } from '../data-table/table-key.ts'

type CustomColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  meta?: {
    className?: string
  }
}

type TStickyOption = { stickyHeader: true; stickyDialogHeader?: false } | { stickyHeader?: false; stickyDialogHeader: true } | { stickyHeader?: false; stickyDialogHeader?: false }

export function getInitialPagination<T extends TPagination>(key: TableKeyEnum, fallback: T): T {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${STORAGE_PAGINATION_KEY_PREFIX}${key}`)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {}
    }
  }
  return fallback
}

interface BaseDataTableProps<TData, TValue> {
  columns: CustomColumnDef<TData, TValue>[]
  loading?: boolean
  data: TData[]
  showFilter?: boolean
  showVisibility?: boolean
  noResultsText?: string
  noDataMarkup?: ReactElement
  onRowClick?: (rowData: TData) => void
  sortFields?: { key: string; label: string }[]
  onSortChange?: (sortCondition: any[]) => void
  pagination?: TPagination | null
  onPaginationChange?: (arg: TPagination) => void
  paginationMeta?: TPaginationMeta
  wrapperClass?: string
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  footer?: ReactElement | null
  tableKey: TableKeyEnum | undefined
  defaultSorting?: { field: string; direction?: OrderDirection }[] | undefined
}

type DataTableProps<TData, TValue> = BaseDataTableProps<TData, TValue> & TStickyOption

export const STORAGE_SORTING_KEY_PREFIX = 'sorting:'
export const STORAGE_PAGINATION_KEY_PREFIX = 'pagination:'
export type SortCondition<TField extends string> = {
  field: TField
  direction: OrderDirection
}

export function getInitialSortConditions<TField extends string>(
  tableKey: TableKeyEnum,
  validSortKeys: Record<string, TField> | TField[],
  defaultSortFields: SortCondition<TField>[],
): SortCondition<TField>[] {
  const validKeysArray = Array.isArray(validSortKeys) ? validSortKeys : Object.values(validSortKeys)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${STORAGE_SORTING_KEY_PREFIX}${tableKey}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SortCondition<string>[]
        const sanitized: SortCondition<TField>[] = parsed.filter((item): item is SortCondition<TField> => validKeysArray.includes(item.field as TField))

        if (sanitized.length > 0) {
          return sanitized
        }
      } catch {}
    }
  }

  return defaultSortFields
}

const normalizeKey = (key: string) => key.replace(/_/g, '').toLowerCase()
const cssVarKey = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')

interface VisibleColumnInfo {
  id: string
  defSize: number
  minSize: number
  maxSize: number
}

function redistributeColumnWidths(visibleColumns: VisibleColumnInfo[], currentSizing: Record<string, number>, containerWidth: number, fixedMaxColumns: Set<string>): Record<string, number> {
  if (containerWidth <= 0 || visibleColumns.length === 0) return currentSizing

  const sizes: Record<string, number> = {}
  for (const col of visibleColumns) {
    sizes[col.id] = currentSizing[col.id] ?? col.defSize
  }

  const total = visibleColumns.reduce((sum, col) => sum + sizes[col.id], 0)
  if (total >= containerWidth) return sizes

  let deficit = containerWidth - total
  const capped = new Set<string>()

  // Iterative loop to handle columns hitting their maxSize cap
  for (let iter = 0; iter < visibleColumns.length && deficit > 0.5; iter++) {
    const growable = visibleColumns.filter((col) => !fixedMaxColumns.has(col.id) && !capped.has(col.id))
    if (growable.length === 0) break

    const growableTotal = growable.reduce((sum, col) => sum + sizes[col.id], 0)
    if (growableTotal <= 0) break

    let distributed = 0
    let newlyCapped = false

    for (const col of growable) {
      const share = (sizes[col.id] / growableTotal) * deficit
      const proposed = sizes[col.id] + share

      if (proposed >= col.maxSize) {
        distributed += col.maxSize - sizes[col.id]
        sizes[col.id] = col.maxSize
        capped.add(col.id)
        newlyCapped = true
      } else {
        distributed += share
        sizes[col.id] = Math.round(proposed * 100) / 100
      }
    }

    deficit -= distributed
    if (!newlyCapped) break
  }

  return sizes
}

const AUTO_MIN_SIZE_CHAR_WIDTH = 8
const AUTO_MIN_SIZE_PADDING = 24
const AUTO_MIN_SIZE_SORT_ICON = 24

function calcHeaderTextMinSize(header: unknown, hasSortField: boolean): number | undefined {
  if (typeof header !== 'string') return undefined
  const textWidth = (header.length + 2) * AUTO_MIN_SIZE_CHAR_WIDTH + AUTO_MIN_SIZE_PADDING
  const sortWidth = hasSortField ? AUTO_MIN_SIZE_SORT_ICON : 0
  return Math.max(60, textWidth + sortWidth)
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
  setColumnVisibility,
  columnVisibility,
  footer,
  tableKey,
  defaultSorting,
  stickyHeader = false,
  stickyDialogHeader = false,
}: DataTableProps<TData, TValue>) {
  const [sortConditions, setSortConditions] = useState<{ field: string; direction?: OrderDirection }[]>(defaultSorting ?? [])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  const currentPage = pagination?.page || 1
  const currentPageSize = pagination?.pageSize || 10

  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({})

  const { totalCount, pageInfo, isLoading } = paginationMeta || {}

  const columnResizeMode: ColumnResizeMode = 'onChange'
  const columnResizeDirection: ColumnResizeDirection = 'ltr'

  const totalPages = useMemo(() => {
    return totalCount ? Math.ceil(totalCount / currentPageSize) : 1
  }, [totalCount, currentPageSize])

  const updatePagination = (next: TPagination) => {
    if (typeof window !== 'undefined' && tableKey) {
      const safePagination = {
        page: next.page,
        pageSize: next.pageSize,
        query: {
          first: next.query?.first,
          last: next.query?.last,
          after: next.query?.after,
          before: next.query?.before,
        },
      }

      localStorage.setItem(`${STORAGE_PAGINATION_KEY_PREFIX}${tableKey}`, JSON.stringify(safePagination))
    }

    onPaginationChange?.(next)
  }

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
  const [containerWidth, setContainerWidth] = useState(0)

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

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setContainerWidth((prev) => (Math.abs(prev - width) > 0.5 ? width : prev))
      }
      checkScroll()
    })
    ro.observe(scrollRefElement)

    return () => {
      scrollRefElement.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
      ro.disconnect()
    }
  }, [columnVisibility, pageInfo])

  const enhancedColumns = useMemo(() => {
    return columns.map((col) => {
      if (col.minSize != null) return col
      const colId = (col as any).id ?? (col as any).accessorKey ?? ''
      const hasSortField = sortFields?.some((sf) => normalizeKey(sf.key) === normalizeKey(colId)) ?? false
      const autoMinSize = calcHeaderTextMinSize(col.header, hasSortField)
      if (autoMinSize == null) return col
      return { ...col, minSize: autoMinSize }
    })
  }, [columns, sortFields])

  const fixedMaxColumns = useMemo(() => new Set(enhancedColumns.filter((col) => (col as any).maxSize != null).map((col) => (col as any).id ?? (col as any).accessorKey ?? '')), [enhancedColumns])

  const tableRef = useRef<TanstackTable<TData> | null>(null)
  const containerWidthRef = useRef(0)
  const columnSizesRef = useRef<Record<string, number>>(columnSizes)

  const getVisibleColumnInfos = useCallback(
    (tbl: TanstackTable<TData>): VisibleColumnInfo[] =>
      tbl.getVisibleLeafColumns().map((col) => ({
        id: col.id,
        defSize: (col.columnDef.size as number) ?? 150,
        minSize: (col.columnDef.minSize as number) ?? 60,
        maxSize: (col.columnDef.maxSize as number) ?? 800,
      })),
    [],
  )

  const handleColumnSizingChange: OnChangeFn<ColumnSizingState> = useCallback(
    (updater) => {
      setColumnSizes((prev) => {
        const rawNext = typeof updater === 'function' ? updater(prev) : updater
        const tbl = tableRef.current
        const cw = containerWidthRef.current
        if (!tbl || cw <= 0) return rawNext

        const visibleCols = getVisibleColumnInfos(tbl)
        return redistributeColumnWidths(visibleCols, rawNext, cw, fixedMaxColumns)
      })
    },
    [fixedMaxColumns, getVisibleColumnInfos],
  )

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: handleColumnSizingChange,
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
      minSize: 60,
      maxSize: 800,
    },
  })

  tableRef.current = table
  containerWidthRef.current = containerWidth
  columnSizesRef.current = columnSizes

  useLayoutEffect(() => {
    if (containerWidth <= 0) return
    const visibleCols = getVisibleColumnInfos(table)
    if (visibleCols.length === 0) return

    const redistributed = redistributeColumnWidths(visibleCols, columnSizesRef.current, containerWidth, fixedMaxColumns)

    const changed = visibleCols.some((col) => {
      const prev = columnSizesRef.current[col.id] ?? col.defSize
      const next = redistributed[col.id] ?? col.defSize
      return Math.abs(prev - next) > 0.5
    })

    if (changed) {
      setColumnSizes(redistributed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth, columnVisibility])

  const columnSizingInfo = table.getState().columnSizingInfo

  const columnSizeVars = useMemo(() => {
    const vars: Record<string, string> = {}
    table.getAllLeafColumns().forEach((column) => {
      vars[`--col-${cssVarKey(column.id)}`] = `${column.getSize()}px`
    })
    return vars as CSSProperties
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSizes])

  const setNewPagination = (newPage: number, query: TPagination['query']) => {
    if (!pagination) {
      return
    }

    const next = { ...pagination, page: newPage, query }
    updatePagination(next)
  }

  const handlePageSizeChange = (newSize: number) => {
    if (!pagination) {
      return
    }

    const next = {
      ...pagination,
      page: 1,
      pageSize: newSize,
      query: { first: newSize },
    }
    updatePagination(next)
  }

  const goToFirstPage = () => {
    setNewPagination(1, { first: currentPageSize })
  }

  const goToLastPage = () => {
    if (!pagination || !totalCount) return

    const lastPage = Math.ceil(totalCount / currentPageSize)
    const itemsBeforeLast = currentPageSize * (lastPage - 1)
    const remaining = totalCount - itemsBeforeLast

    setNewPagination(lastPage, { last: remaining })
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
    if (sortConditions && sortConditions.length > 0 && sortConditions.every(({ direction }) => direction !== undefined)) {
      onSortChange?.(sortConditions as { field: string; direction: OrderDirection }[])
      if (typeof window !== 'undefined' && tableKey) {
        localStorage.setItem(`${STORAGE_SORTING_KEY_PREFIX}${tableKey}`, JSON.stringify(sortConditions))
      }
      return
    }

    // Keep server/client sorting in sync when user clears all sorts
    onSortChange?.([])
    if (typeof window !== 'undefined' && tableKey) {
      localStorage.removeItem(`${STORAGE_SORTING_KEY_PREFIX}${tableKey}`)
    }
  }, [onSortChange, sortConditions, tableKey])

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
            <Table
              ref={scrollRef}
              variant="data"
              stickyHeader={stickyHeader}
              stickyDialogHeader={stickyDialogHeader}
              style={{
                ...columnSizeVars,
                width: containerWidth > 0 ? Math.max(containerWidth, table.getTotalSize()) : undefined,
              }}
            >
              <TableHeader variant="data">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow variant="data" key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const sortField = sortFields?.find((sf) => normalizeKey(sf.key) === normalizeKey(header.column.id))
                      const columnCssKey = cssVarKey(header.column.id)
                      const columnWidth = `var(--col-${columnCssKey})`
                      const isResizing = header.column.getIsResizing()
                      const sorting = sortConditions.find((sc) => sc.field === sortField?.key)?.direction || undefined
                      const ariaSort = sorting === OrderDirection.ASC ? 'ascending' : sorting === OrderDirection.DESC ? 'descending' : 'none'
                      return (
                        <TableHead variant="data" key={`${header.id}-${index}`} style={{ position: 'relative', width: columnWidth, minWidth: columnWidth }} aria-sort={ariaSort}>
                          {header.isPlaceholder ? null : (
                            <div className="flex items-center gap-1" style={{ width: columnWidth }}>
                              {/* Sorting Area */}
                              <div
                                onClick={() => sortField?.key && handleSortChange(sortField.key)}
                                className={cn('flex items-center gap-1 select-none', sortField ? 'cursor-pointer' : 'cursor-default')}
                                style={{ flex: '1 1 auto' }}
                                title={sortField ? `Sort by ${sortField.label}` : undefined}
                                role={sortField ? 'button' : undefined}
                                aria-disabled={!sortField}
                                tabIndex={sortField ? 0 : -1}
                                onKeyDown={(event) => {
                                  if (!sortField) return
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    handleSortChange(sortField.key)
                                  }
                                }}
                              >
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
                            </div>
                          )}
                          {/* Resizing Area */}
                          {index < headerGroup.headers.length - 1 && (
                            <div
                              onDoubleClick={() => header.column.resetSize()}
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={cn(
                                'absolute right-0 top-0 h-full w-3 cursor-col-resize z-10 group/resizer select-none touch-none',
                                'flex items-center justify-center',
                                'opacity-80 hover:opacity-100 focus-visible:opacity-100',
                                isResizing && 'opacity-100',
                              )}
                              role="separator"
                              aria-orientation="vertical"
                              aria-label={`Resize ${header.column.id} column`}
                            >
                              <div
                                className={cn('h-3/5 w-px rounded-full transition duration-150', isResizing ? 'bg-primary' : 'bg-[var(--color-border)] opacity-70 group-hover/resizer:opacity-100')}
                              />
                            </div>
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              {columnSizingInfo.isResizingColumn ? (
                <MemoizedDataTableBody table={table} onRowClick={onRowClick} loading={loading} noDataMarkup={noDataMarkup} noResultsText={noResultsText} />
              ) : (
                <DataTableBodyContent table={table} onRowClick={onRowClick} loading={loading} noDataMarkup={noDataMarkup} noResultsText={noResultsText} />
              )}
            </Table>
          </div>
          {footer}
        </div>
      </div>
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

type DataRowProps<TData, TValue> = {
  row: Row<TData>
  onRowClick?: (rowData: TData) => void
  cssVarKey: (id: string) => string
}

const DataRow = memo(function DataRow<TData, TValue>({ row, onRowClick, cssVarKey }: DataRowProps<TData, TValue>) {
  return (
    <TableRow variant="data" onClick={() => onRowClick?.(row.original)} className={`hover:bg-table-row-bg-hover ${onRowClick ? 'cursor-pointer' : ''}`} data-state={row.getIsSelected() && 'selected'}>
      {row.getVisibleCells().map((cell) => {
        const widthVar = `var(--col-${cssVarKey(cell.column.id)})`
        return (
          <TableCell
            variant="data"
            key={cell.id}
            className={(cell.column.columnDef.meta as CustomColumnDef<TData, TValue>['meta'])?.className || ''}
            style={{ width: widthVar, minWidth: widthVar, maxWidth: widthVar }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}) as <TData, TValue>(props: DataRowProps<TData, TValue>) => React.ReactElement

const NoData = <TData, TValue>({ loading, columns, noDataMarkup, noResultsText }: NoDataProps<TData, TValue>) => {
  const visibleCols = columns.filter((col) => col.getIsVisible())

  if (loading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, rowIndex) => (
          <TableRow key={rowIndex} variant="data">
            {visibleCols.map((col, colIndex) => (
              <TableCell key={colIndex} variant="data">
                <div className="animate-custom-pulse bg-white/20 rounded-lg h-2.5 w-full" style={{ width: `${col.getSize()}px` }} />
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
        {noDataMarkup ? noDataMarkup : <div className="flex items-center justify-center w-full h-full p-5">{noResultsText}</div>}
      </TableCell>
    </TableRow>
  )
}

interface DataTableBodyContentProps<TData> {
  table: TanstackTable<TData>
  onRowClick?: (rowData: TData) => void
  loading: boolean
  noDataMarkup?: ReactElement
  noResultsText: string
}

function DataTableBodyContent<TData>({ table, onRowClick, loading, noDataMarkup, noResultsText }: DataTableBodyContentProps<TData>) {
  return (
    <TableBody variant="data">
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => <DataRow key={row.id} row={row} onRowClick={onRowClick} cssVarKey={cssVarKey} />)
      ) : (
        <NoData loading={loading} columns={table.getAllLeafColumns()} noDataMarkup={noDataMarkup} noResultsText={noResultsText} />
      )}
    </TableBody>
  )
}

const MemoizedDataTableBody = memo(DataTableBodyContent, (prev, next) => {
  return prev.table.options.data === next.table.options.data
}) as typeof DataTableBodyContent
