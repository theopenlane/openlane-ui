import { type ColumnDef, type RowData, type VisibilityState } from '@repo/ui/table-types'
import { isColumnVisible } from './is-column-visible'

export const getExportFields = <T extends RowData>(columns: ColumnDef<T>[], visibility: VisibilityState, baseFields: string[] = []): string[] => {
  const fields = new Set(baseFields)

  for (const column of columns) {
    if (!isColumnVisible(column, visibility)) continue

    const accessorKey = (column as { accessorKey?: string }).accessorKey
    const exportFields = column.meta?.exportFields ?? [column.meta?.exportPrefix ?? (typeof column.header === 'string' ? accessorKey : undefined)]

    const filtered = exportFields.filter((field): field is string => Boolean(field))

    for (const field of filtered) {
      fields.add(field)
    }
  }

  return [...fields]
}
