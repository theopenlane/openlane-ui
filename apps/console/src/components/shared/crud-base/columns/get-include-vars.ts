import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'

type IncludeAwareMeta = { gqlInclude?: string[] }

export const getIncludeVars = <T>(columns: ColumnDef<T>[], visibility: VisibilityState): Record<string, boolean> => {
  const result: Record<string, boolean> = {}

  for (const column of columns) {
    const includeKeys = (column.meta as IncludeAwareMeta | undefined)?.gqlInclude
    if (!includeKeys?.length) continue

    const accessorKey = (column as { accessorKey?: string }).accessorKey
    const isVisible = typeof accessorKey === 'string' ? visibility[accessorKey] !== false : true

    for (const key of includeKeys) {
      result[key] = result[key] || isVisible
    }
  }

  return result
}
