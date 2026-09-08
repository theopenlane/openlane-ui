import { type ColumnDef, type RowData, type VisibilityState } from '@repo/ui/table-types'
import { resolveColumnId } from './resolve-column-id'

export const isColumnVisible = <T extends RowData>(column: ColumnDef<T>, visibility: VisibilityState): boolean => {
  if (column.enableHiding === false) {
    return true
  }

  const columnId = resolveColumnId(column)
  return columnId ? visibility[columnId] !== false : true
}
