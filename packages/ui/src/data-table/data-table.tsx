'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../table/table'
import { Button } from '../button/button'
import { ReactElement, useState } from 'react'
import { Input } from '../input/input'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu'
import { EyeIcon } from 'lucide-react'

type CustomColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  meta?: {
    className?: string
  }
}
interface DataTableProps<TData, TValue> {
  columns: CustomColumnDef<TData, TValue>[] // ✅ Now supports `meta.className`
  loading?: boolean
  data: TData[]
  showFilter?: boolean
  showVisibility?: boolean
  noResultsText?: string
  noDataMarkup?: ReactElement
  onRowClick?: (rowData: TData) => void
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
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
              {headerGroup.headers.map((header) => {
                const columnWidth = header.getSize() === 20 ? 'auto' : `${header.getSize()}px`
                return (
                  <TableHead key={header.id} style={{ width: columnWidth }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                {' '}
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
