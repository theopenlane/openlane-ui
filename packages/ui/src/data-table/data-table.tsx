'use client'

import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, VisibilityState } from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../table/table'
import { Button } from '../button/button'
import { ReactElement, useEffect, useState } from 'react'
import { Input } from '../input/input'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu'
import { ArrowDown, ArrowUp, ArrowUpDown, EyeIcon } from 'lucide-react'
import { OrderDirection } from '@repo/codegen/src/schema.ts'

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
  pageSize?: number
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
  pageSize,
  sortFields,
  onSortChange,
}: DataTableProps<TData, TValue>) {
  const [sortConditions, setSortConditions] = useState<{ field: string; direction?: OrderDirection }[]>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize ?? 10,
  })

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
      pagination,
    },
    defaultColumn: {
      size: 0,
    },
  })

  return (
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
                  .map((column, index) => {
                    return (
                      <DropdownMenuCheckboxItem key={`${column.id}-${index}`} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                //This is used for converting header and sort keys to same format
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
                      <div className="flex items-center gap-1">
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
        {(table.getCanNextPage() || table.getCanPreviousPage()) && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-right gap-2">
                <Button variant="outlineInputPadding" size="md" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  Previous
                </Button>
                <Button variant="outlineInputPadding" size="md" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
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
