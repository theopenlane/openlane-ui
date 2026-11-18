import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { type SortCondition } from '@repo/ui/data-table'
import { type TableKeyValue } from '@repo/ui/table-key'
import { type TPagination, type TPaginationQuery } from '@repo/ui/pagination-types'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, getOrganizationStorageKey, removeOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'
import { safeSessionStorage } from '@/lib/storage/safe-local-storage'
import { isRecord } from '@/utils/type-guards'
import { createOrgPersistedStore, parseStringUnion, useOrgPersistedState, type OrgPersistedStore } from '@/lib/storage/org-persisted-store'

const SORTING_KEY_PREFIX = 'sorting:'
const PAGINATION_KEY_PREFIX = 'pagination:'
const VIEW_MODE_KEY_PREFIX = 'view-mode:'
const PAGE_KEY_PREFIX = 'table-page:'

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

type TScopedPage = {
  scope: string
  pagination: TPagination
}

type TPaginationState = {
  organizationId?: string
  scope: string | null
  pagination: TPagination
  pendingRestore: TScopedPage | null
}

type TPageRestore = {
  where: object | null | undefined
  orderBy: object | null | undefined
  ready: boolean
}

type TOrgTablePaginationOptions = {
  allowedPageSizes?: number[]
  restorePage?: TPageRestore
}

const readPagination = (fallback: TPagination, tableKey?: TableKeyValue, organizationId?: string, allowedPageSizes?: number[]): TPagination => {
  if (!tableKey) return fallback
  const stored = getOrganizationStorageItem(`${PAGINATION_KEY_PREFIX}${tableKey}`, organizationId)
  if (!stored) return fallback
  try {
    const parsed = JSON.parse(stored) as number | Pick<TPagination, 'pageSize'>
    const pageSize = typeof parsed === 'number' ? parsed : parsed?.pageSize
    const isAllowed = Number.isInteger(pageSize) && pageSize > 0 && (!allowedPageSizes || allowedPageSizes.includes(pageSize))
    if (isAllowed) {
      return toFirstPage(fallback, pageSize)
    }
  } catch {
    return fallback
  }
  return fallback
}

const toFirstPage = (fallback: TPagination, pageSize: number): TPagination => ({ ...fallback, pageSize, query: { ...fallback.query, first: pageSize } })

const getPageStorageKey = (tableKey: TableKeyValue, organizationId: string): string => getOrganizationStorageKey(`${PAGE_KEY_PREFIX}${tableKey}`, organizationId)

const isOptionalCount = (value: unknown): boolean => value === undefined || (typeof value === 'number' && Number.isInteger(value) && value > 0)

const isOptionalCursor = (value: unknown): boolean => value === undefined || value === null || typeof value === 'string'

const isPaginationQuery = (value: unknown): value is TPaginationQuery =>
  isRecord(value) && isOptionalCount(value.first) && isOptionalCount(value.last) && isOptionalCursor(value.after) && isOptionalCursor(value.before)

const readStoredPage = (tableKey: TableKeyValue, organizationId: string, pageSize: number): TScopedPage | null => {
  const raw = safeSessionStorage.getItem(getPageStorageKey(tableKey, organizationId))
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.scope !== 'string' || !isRecord(parsed.pagination)) return null
    const { page, query } = parsed.pagination
    const isValid = typeof page === 'number' && Number.isInteger(page) && page >= 1 && parsed.pagination.pageSize === pageSize && isPaginationQuery(query)
    return isValid ? { scope: parsed.scope, pagination: { page, pageSize, query } } : null
  } catch {
    return null
  }
}

const readPaginationState = (fallback: TPagination, tableKey: TableKeyValue | undefined, organizationId: string | undefined, options: TOrgTablePaginationOptions): TPaginationState => {
  const base = readPagination(fallback, tableKey, organizationId, options.allowedPageSizes)
  const isRestorable = !!options.restorePage && !!tableKey && !!organizationId
  const stored = isRestorable ? readStoredPage(tableKey, organizationId, base.pageSize) : null
  return stored ? { organizationId, ...stored, pendingRestore: stored } : { organizationId, scope: null, pagination: base, pendingRestore: null }
}

const settleScope = (state: TPaginationState, scope: string, fallback: TPagination): TPaginationState => {
  if (state.pendingRestore?.scope === scope) return { ...state, scope, pagination: state.pendingRestore.pagination, pendingRestore: null }
  if (state.scope === scope) return state
  return { ...state, scope, pagination: state.scope === null ? state.pagination : toFirstPage(fallback, state.pagination.pageSize) }
}

export const useOrgTablePagination = (fallback: TPagination, tableKey?: TableKeyValue, options: TOrgTablePaginationOptions = {}): [TPagination, Dispatch<SetStateAction<TPagination>>, () => void] => {
  const { currentOrgId } = useOrganization()
  const [state, setState] = useState<TPaginationState>(() => readPaginationState(fallback, tableKey, currentOrgId, options))
  const { restorePage } = options
  const isRestorable = !!restorePage
  const scope = restorePage?.ready ? JSON.stringify({ where: restorePage.where, orderBy: restorePage.orderBy }) : null
  const fallbackRef = useRef(fallback)
  const persistedPageSizeRef = useRef(state.pagination.pageSize)

  const settledState = scope === null ? state : settleScope(state, scope, fallback)

  if (state.organizationId !== currentOrgId) {
    setState(readPaginationState(fallback, tableKey, currentOrgId, options))
  } else if (settledState !== state) {
    setState(settledState)
  }

  useEffect(() => {
    fallbackRef.current = fallback
  })

  useEffect(() => {
    const { organizationId, pagination } = state
    if (pagination.pageSize === persistedPageSizeRef.current) return
    persistedPageSizeRef.current = pagination.pageSize
    if (tableKey && organizationId) {
      setOrganizationStorageItem(`${PAGINATION_KEY_PREFIX}${tableKey}`, String(pagination.pageSize), organizationId)
    }
  }, [tableKey, state])

  useEffect(() => {
    const { organizationId, scope: stateScope, pagination } = state
    if (!isRestorable || !tableKey || !organizationId || stateScope === null) return
    safeSessionStorage.setItem(getPageStorageKey(tableKey, organizationId), JSON.stringify({ scope: stateScope, pagination }))
  }, [isRestorable, tableKey, state])

  const setPagination = useCallback<Dispatch<SetStateAction<TPagination>>>((next) => {
    setState((prev) => ({ ...prev, pagination: typeof next === 'function' ? next(prev.pagination) : next, pendingRestore: null }))
  }, [])

  const resetPagination = useCallback(() => {
    setPagination((prev) => toFirstPage(fallbackRef.current, prev.pageSize))
  }, [setPagination])

  return [state.pagination, setPagination, resetPagination]
}

export type TTableViewMode = 'table' | 'card'

const DEFAULT_TABLE_VIEW_MODE: TTableViewMode = 'table'

const isTableViewMode = (value: string): value is TTableViewMode => value === 'table' || value === 'card'

const parseJsonOrLegacyUnquotedViewMode = (raw: string): TTableViewMode | null => parseStringUnion(raw, isTableViewMode) ?? (isTableViewMode(raw) ? raw : null)

const viewModeStores = new Map<TableKeyValue, OrgPersistedStore<TTableViewMode>>()

const getViewModeStore = (tableKey: TableKeyValue): OrgPersistedStore<TTableViewMode> => {
  const existing = viewModeStores.get(tableKey)
  if (existing) return existing

  const store = createOrgPersistedStore<TTableViewMode>(`${VIEW_MODE_KEY_PREFIX}${tableKey}`, parseJsonOrLegacyUnquotedViewMode, () => DEFAULT_TABLE_VIEW_MODE)
  viewModeStores.set(tableKey, store)
  return store
}

export const useOrgTableViewMode = (tableKey: TableKeyValue): [TTableViewMode, (next: TTableViewMode) => void] => {
  const { currentOrgId } = useOrganization()
  const store = useMemo(() => getViewModeStore(tableKey), [tableKey])
  const { value, setValue } = useOrgPersistedState(store, currentOrgId)

  return [value, setValue]
}
