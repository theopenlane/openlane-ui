import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { type SortCondition } from '@repo/ui/data-table'
import { type TableKeyValue } from '@repo/ui/table-key'
import { type TPagination } from '@repo/ui/pagination-types'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

const SORTING_KEY_PREFIX = 'sorting:'
const PAGINATION_KEY_PREFIX = 'pagination:'

const readSort = <TField extends string>(
  tableKey: TableKeyValue,
  validSortKeys: Record<string, TField> | TField[],
  defaultSortFields: SortCondition<TField>[],
  organizationId?: string,
): SortCondition<TField>[] => {
  const validKeysArray = Array.isArray(validSortKeys) ? validSortKeys : Object.values(validSortKeys)
  const stored = getOrganizationStorageItem(`${SORTING_KEY_PREFIX}${tableKey}`, organizationId)
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
  return defaultSortFields
}

const writeSort = <TField extends string>(tableKey: TableKeyValue, sorting: SortCondition<TField>[], organizationId?: string): void => {
  const key = `${SORTING_KEY_PREFIX}${tableKey}`
  if (sorting.length > 0 && sorting.every((condition) => condition.direction !== undefined)) {
    setOrganizationStorageItem(key, JSON.stringify(sorting), organizationId)
  } else {
    removeOrganizationStorageItem(key, organizationId)
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

const readPagination = (fallback: TPagination, tableKey?: TableKeyValue, organizationId?: string): TPagination => {
  if (!tableKey) return fallback
  const stored = getOrganizationStorageItem(`${PAGINATION_KEY_PREFIX}${tableKey}`, organizationId)
  if (!stored) return fallback
  try {
    const parsed = JSON.parse(stored) as number | Pick<TPagination, 'pageSize'>
    const pageSize = typeof parsed === 'number' ? parsed : parsed?.pageSize
    if (Number.isInteger(pageSize) && pageSize > 0) {
      return { ...fallback, pageSize, query: { ...fallback.query, first: pageSize } }
    }
  } catch {
    return fallback
  }
  return fallback
}

export const useOrgTablePagination = (fallback: TPagination, tableKey?: TableKeyValue): [TPagination, Dispatch<SetStateAction<TPagination>>, () => void] => {
  const { currentOrgId } = useOrganization()
  const [paginationState, setPaginationState] = useState<TPagination>(() => readPagination(fallback, tableKey, currentOrgId))
  const prevOrgIdRef = useRef(currentOrgId)
  const paginationRef = useRef(paginationState)
  const fallbackRef = useRef(fallback)

  useEffect(() => {
    fallbackRef.current = fallback
  })

  useEffect(() => {
    if (prevOrgIdRef.current === currentOrgId) return
    prevOrgIdRef.current = currentOrgId
    const next = readPagination(fallback, tableKey, currentOrgId)
    paginationRef.current = next
    setPaginationState(next)
  }, [currentOrgId, fallback, tableKey])

  const setPagination = useCallback<Dispatch<SetStateAction<TPagination>>>(
    (next) => {
      const resolved = typeof next === 'function' ? next(paginationRef.current) : next
      if (tableKey && currentOrgId && resolved.pageSize !== paginationRef.current.pageSize) {
        setOrganizationStorageItem(`${PAGINATION_KEY_PREFIX}${tableKey}`, String(resolved.pageSize), currentOrgId)
      }
      paginationRef.current = resolved
      setPaginationState(resolved)
    },
    [tableKey, currentOrgId],
  )

  const resetPagination = useCallback(() => {
    const currentFallback = fallbackRef.current
    setPagination((prev) => ({ ...currentFallback, pageSize: prev.pageSize, query: { ...currentFallback.query, first: prev.pageSize } }))
  }, [setPagination])

  return [paginationState, setPagination, resetPagination]
}
