import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { type SortCondition } from '@repo/ui/data-table'
import { type TableKeyValue } from '@repo/ui/table-key'
import { type TPagination } from '@repo/ui/pagination-types'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

const SORTING_KEY_PREFIX = 'sorting:'

const readSort = <TField extends string>(
  tableKey: TableKeyValue,
  validSortKeys: Record<string, TField> | TField[],
  defaultSortFields: SortCondition<TField>[],
  organizationId?: string,
): SortCondition<TField>[] => {
  const validKeysArray = Array.isArray(validSortKeys) ? validSortKeys : Object.values(validSortKeys)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(getOrganizationStorageKey(`${SORTING_KEY_PREFIX}${tableKey}`, organizationId))
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SortCondition<string>[]
        const sanitized = parsed.filter((item): item is SortCondition<TField> => validKeysArray.includes(item.field as TField))
        if (sanitized.length > 0) {
          return sanitized
        }
      } catch {
        return defaultSortFields
      }
    }
  }
  return defaultSortFields
}

const writeSort = <TField extends string>(tableKey: TableKeyValue, sorting: SortCondition<TField>[], organizationId?: string): void => {
  if (typeof window === 'undefined') return
  const key = getOrganizationStorageKey(`${SORTING_KEY_PREFIX}${tableKey}`, organizationId)
  if (sorting.length > 0 && sorting.every((condition) => condition.direction !== undefined)) {
    localStorage.setItem(key, JSON.stringify(sorting))
  } else {
    localStorage.removeItem(key)
  }
}

export const useOrgTableSort = <TField extends string>(
  tableKey: TableKeyValue,
  validSortKeys: Record<string, TField> | TField[],
  defaultSortFields: SortCondition<TField>[],
): [SortCondition<TField>[], (next: SortCondition<TField>[]) => void] => {
  const { currentOrgId } = useOrganization()
  const [sortingState, setSortingState] = useState<SortCondition<TField>[]>(() => readSort(tableKey, validSortKeys, defaultSortFields, currentOrgId))
  const prevOrgIdRef = useRef(currentOrgId)

  useEffect(() => {
    if (prevOrgIdRef.current === currentOrgId) return
    prevOrgIdRef.current = currentOrgId
    setSortingState(readSort(tableKey, validSortKeys, defaultSortFields, currentOrgId))
  }, [currentOrgId, tableKey, validSortKeys, defaultSortFields])

  const setSorting = useCallback(
    (next: SortCondition<TField>[]) => {
      setSortingState(next)
      writeSort(tableKey, next, currentOrgId)
    },
    [tableKey, currentOrgId],
  )

  return [sortingState, setSorting]
}

export const useOrgTablePagination = (fallback: TPagination): [TPagination, Dispatch<SetStateAction<TPagination>>] => {
  const { currentOrgId } = useOrganization()
  const [pagination, setPagination] = useState<TPagination>(fallback)
  const prevOrgIdRef = useRef(currentOrgId)

  useEffect(() => {
    if (prevOrgIdRef.current === currentOrgId) return
    prevOrgIdRef.current = currentOrgId
    setPagination(fallback)
  }, [currentOrgId, fallback])

  return [pagination, setPagination]
}
