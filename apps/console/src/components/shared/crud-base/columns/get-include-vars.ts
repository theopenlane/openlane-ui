import { type ColumnDef, type RowData, type VisibilityState } from '@repo/ui/table-types'
import { resolveColumnId } from './resolve-column-id'

type IncludeAwareMeta = { gqlInclude?: string[] }

export const getIncludeVars = <T extends RowData>(columns: ColumnDef<T>[], visibility: VisibilityState): Record<string, boolean> => {
  const result: Record<string, boolean> = {}

  for (const column of columns) {
    const includeKeys = (column.meta as IncludeAwareMeta | undefined)?.gqlInclude
    if (!includeKeys?.length) continue

    const columnId = resolveColumnId(column)
    const isVisible = columnId ? visibility[columnId] !== false : true

    for (const key of includeKeys) {
      result[key] = result[key] || isVisible
    }
  }

  return result
}
