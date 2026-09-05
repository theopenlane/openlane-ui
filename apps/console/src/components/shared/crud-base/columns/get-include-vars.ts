import { type ColumnDef, type RowData, type VisibilityState } from '@repo/ui/table-types'
import { isColumnVisible } from './is-column-visible'

export const getIncludeVars = <T extends RowData>(columns: ColumnDef<T>[], visibility: VisibilityState): Record<string, boolean> => {
  const result: Record<string, boolean> = {}

  for (const column of columns) {
    const includeKeys = column.meta?.gqlInclude
    if (!includeKeys?.length) continue

    const isVisible = isColumnVisible(column, visibility)

    for (const key of includeKeys) {
      result[key] = result[key] || isVisible
    }
  }

  return result
}
