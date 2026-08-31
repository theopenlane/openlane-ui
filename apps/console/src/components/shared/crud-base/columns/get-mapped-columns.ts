import { type ColumnDef, type RowData } from '@repo/ui/table-types'

export const getMappedColumns = <T extends RowData>(columns: ColumnDef<T>[]) =>
  columns
    .filter((column): column is ColumnDef<T> & { accessorKey: string; header: string } => {
      const col = column as { accessorKey?: string; header?: string }
      return typeof col.accessorKey === 'string' && typeof col.header === 'string'
    })
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header as string,
      meta: (column as { meta?: { exportPrefix?: string } }).meta,
    }))
