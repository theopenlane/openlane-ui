import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type Cell as TanstackCell,
  type CellData,
  type Column as TanstackColumn,
  type ColumnDef as TanstackColumnDef,
  type ColumnVisibilityState,
  type Header as TanstackHeader,
  type ReactTable as TanstackReactTable,
  type Row as TanstackRow,
  type RowData,
  type Table as TanstackTable,
} from '@tanstack/react-table'

export const tableFeatureSet = tableFeatures({
  columnVisibilityFeature,
  columnOrderingFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
})

export type TableFeatureSet = typeof tableFeatureSet

export type ColumnDef<TData extends RowData, TValue extends CellData = CellData> = TanstackColumnDef<TableFeatureSet, TData, TValue>
export type Column<TData extends RowData, TValue extends CellData = CellData> = TanstackColumn<TableFeatureSet, TData, TValue>
export type Cell<TData extends RowData, TValue extends CellData = CellData> = TanstackCell<TableFeatureSet, TData, TValue>
export type Header<TData extends RowData, TValue extends CellData = CellData> = TanstackHeader<TableFeatureSet, TData, TValue>
export type Row<TData extends RowData> = TanstackRow<TableFeatureSet, TData>
export type Table<TData extends RowData> = TanstackReactTable<TableFeatureSet, TData>
export type CoreTable<TData extends RowData> = TanstackTable<TableFeatureSet, TData>
export type VisibilityState = ColumnVisibilityState

export type { CellData, ColumnFiltersState, ColumnResizeDirection, ColumnResizeMode, ColumnSizingState, OnChangeFn, RowData } from '@tanstack/react-table'
