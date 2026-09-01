import { type ColumnDef, type RowData } from '@repo/ui/table-types'

export const resolveColumnId = <T extends RowData>(column: ColumnDef<T>): string | undefined => {
  const accessorKey = (column as { accessorKey?: string }).accessorKey
  return column.id ?? accessorKey?.replaceAll('.', '_') ?? (typeof column.header === 'string' ? column.header : undefined)
}
