import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'

export type TFilterValue = string | string[] | number | boolean | Date | undefined
export type TFilterState = Record<string, TFilterValue>

const STORAGE_PREFIX = 'filters:'

const storageKey = (pageKey: TableFilterKeysEnum) => `${STORAGE_PREFIX}${pageKey}`

export function saveFilters(pageKey: TableFilterKeysEnum, state: TFilterState): void {
  localStorage.setItem(storageKey(pageKey), JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(`filters-updated:${pageKey}`, { detail: state }))
}

export function loadFilters(pageKey: TableFilterKeysEnum): TFilterState | null {
  const saved = localStorage.getItem(storageKey(pageKey))
  if (!saved) return null

  try {
    return JSON.parse(saved, (key, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value)
      }
      return value
    }) as TFilterState
  } catch {
    console.warn(`Invalid filters found in storage for ${pageKey}`)
    return null
  }
}

export function clearFilters(pageKey: TableFilterKeysEnum): void {
  localStorage.removeItem(storageKey(pageKey))
}
