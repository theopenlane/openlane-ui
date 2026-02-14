import { TableKeyValue } from '@repo/ui/table-key'
import { FilterField } from '@/types'
import type { DateRange } from 'react-day-picker'
import { isValid } from 'date-fns'
import { TQuickFilter } from '@/components/shared/table-filter/table-filter-helper.ts'

export type TFilterValue = string | string[] | number | boolean | Date | DateRange | { from?: Date; to?: Date } | undefined
export type TFilterState = Record<string, TFilterValue>
export type TQuickFilterState = { key: string; condition: TFilterState } | Record<string, boolean>

const STORAGE_FILTER_PREFIX = 'filters:'
const STORAGE_QUICK_FILTERS_PREFIX = 'quick-filters:'

const storageFilterKey = (pageKey: TableKeyValue) => `${STORAGE_FILTER_PREFIX}${pageKey}`
const storageQuickFilterKey = (pageKey: TableKeyValue) => `${STORAGE_QUICK_FILTERS_PREFIX}${pageKey}`

export function saveFilters(pageKey: TableKeyValue, state: TFilterState): void {
  localStorage.setItem(storageFilterKey(pageKey), JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(`filters-updated:${pageKey}`, { detail: state }))
}

export function saveQuickFilters(pageKey: TableKeyValue, activeFilter: TQuickFilter): void {
  clearQuickFilters(pageKey)

  let quickFilterState: TQuickFilterState

  if (typeof activeFilter.getCondition === 'function') {
    quickFilterState = {
      key: activeFilter.key,
      condition: activeFilter.getCondition(),
    }
  } else {
    quickFilterState = {
      [activeFilter.key]: true,
    }
  }

  localStorage.setItem(storageQuickFilterKey(pageKey), JSON.stringify(quickFilterState))
}

export function clearQuickFilters(pageKey: TableKeyValue): void {
  localStorage.removeItem(storageQuickFilterKey(pageKey))
}

export function loadQuickFilter(pageKey: TableKeyValue, quickFilters: TQuickFilter[] = []): TQuickFilter | null {
  const activeQuickFilter = quickFilters.find((item) => item.isActive)
  // This is the case when we have active quick filter as default value
  if (activeQuickFilter) {
    clearQuickFilters(pageKey)
    saveQuickFilters(pageKey, activeQuickFilter)
    return activeQuickFilter
  }

  const saved = localStorage.getItem(storageQuickFilterKey(pageKey))
  if (!saved) return null

  try {
    const parsed = JSON.parse(saved)

    if ('key' in parsed && 'condition' in parsed) {
      const matched = quickFilters.find((f) => f.key === parsed.key)
      if (!matched) return null

      return {
        ...matched,
        isActive: true,
        getCondition: () => parsed.condition,
      }
    }

    const savedKey = Object.keys(parsed).find((key) => quickFilters.some((f) => f.key === key && f.type === 'boolean'))
    if (!savedKey) return null

    const matched = quickFilters.find((f) => f.key === savedKey)
    if (!matched) return null

    return {
      ...matched,
      isActive: parsed[savedKey] === true,
    }
  } catch {
    console.warn(`Invalid quick filter found in storage for ${pageKey}`)
    return null
  }
}

export function loadFilters(pageKey: TableKeyValue, filterFields?: FilterField[]): TFilterState | null {
  const saved = localStorage.getItem(storageFilterKey(pageKey))
  if (!saved) {
    return null
  }

  try {
    const parsed = JSON.parse(saved, (key, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value)
      }
      return value
    }) as TFilterState

    if (!filterFields) {
      return parsed
    }

    const validKeys = filterFields.map((f) => f.key)
    const filtered = Object.fromEntries(Object.entries(parsed).filter(([key]) => validKeys.includes(key))) as TFilterState
    return validateValues(filtered, filterFields)
  } catch {
    console.warn(`Invalid filters found in storage for ${pageKey}`)
    return null
  }
}

export function clearFilters(pageKey: TableKeyValue): void {
  localStorage.removeItem(storageFilterKey(pageKey))
}
const validateValues = (values: TFilterState, filterFields: FilterField[]): TFilterState => {
  const result: TFilterState = {}

  for (const [key, value] of Object.entries(values)) {
    const field = filterFields.find((f) => f.key === key)
    if (!field) continue

    switch (field.type) {
      case 'text':
        if (typeof value === 'string' && value.trim() !== '') {
          result[key] = value
        }
        break

      case 'select': {
        if (typeof value === 'string' && value !== '') {
          const exists = field.options?.some((opt) => opt.value === value)
          if (exists) {
            result[key] = value
          }
        }
        break
      }

      case 'multiselect': {
        if (Array.isArray(value) && value.length > 0) {
          const filteredValues = value.filter((v) => field.options?.some((opt) => opt.value === v))

          if (filteredValues.length > 0) {
            result[key] = filteredValues
          }
        }
        break
      }

      case 'boolean':
        if (typeof value === 'boolean') {
          result[key] = value
        }
        break

      case 'sliderNumber':
        if (typeof value === 'number') {
          result[key] = value
        }
        break

      case 'date': {
        const date = value instanceof Date ? value : new Date(value as string)
        if (isValid(date)) {
          result[key] = date
        }
        break
      }

      case 'dateRange': {
        const range = value as DateRange
        const fromValid = !range?.from || isValid(range.from)
        const toValid = !range?.to || isValid(range.to)

        if (range && (range.from || range.to) && fromValid && toValid) {
          result[key] = {
            from: range.from,
            to: range.to,
          }
        }
        break
      }

      default:
        break
    }
  }

  return result
}

//helpers to validate types in case something is needed outside table-filter. filter type, or data object could change so this is used to verify types
export const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export const isDateRange = (value: unknown): value is { from?: Date; to?: Date } => {
  if (typeof value !== 'object' || value === null) return false
  const range = value as { from?: unknown; to?: unknown }
  const fromValid = range.from === undefined || range.from instanceof Date
  const toValid = range.to === undefined || range.to instanceof Date
  return fromValid && toValid
}
export const isDate = (value: unknown): value is Date => {
  return value instanceof Date
}
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number'
}
export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}
