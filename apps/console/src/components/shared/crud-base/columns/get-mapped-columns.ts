import { type ColumnDef } from '@tanstack/react-table'

export const getMappedColumns = <T>(columns: ColumnDef<T>[]) =>
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
