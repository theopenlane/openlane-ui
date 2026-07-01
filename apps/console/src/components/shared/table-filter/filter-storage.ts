import { type TableKeyValue } from '@repo/ui/table-key'
import { type FilterField } from '@/types'
import type { DateRange } from 'react-day-picker'
import { isValid } from 'date-fns'
import { type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper.ts'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

export type TNumberRange = { min: number; max: number }
export type TFilterValue = string | string[] | number | boolean | Date | DateRange | { from?: Date; to?: Date } | TNumberRange | undefined
export type TFilterState = Record<string, TFilterValue>
export type TQuickFilterState = { key: string; condition: TFilterState } | Record<string, boolean>

const STORAGE_FILTER_PREFIX = 'filters:'
const STORAGE_QUICK_FILTERS_PREFIX = 'quick-filters:'

const storageFilterKey = (pageKey: TableKeyValue, organizationId?: string) => getOrganizationStorageKey(`${STORAGE_FILTER_PREFIX}${pageKey}`, organizationId)
const storageQuickFilterKey = (pageKey: TableKeyValue, organizationId?: string) => getOrganizationStorageKey(`${STORAGE_QUICK_FILTERS_PREFIX}${pageKey}`, organizationId)
const filtersUpdatedEvent = (pageKey: TableKeyValue, organizationId?: string) => `filters-updated:${storageFilterKey(pageKey, organizationId)}`

export const saveFilters = (pageKey: TableKeyValue, state: TFilterState, organizationId?: string): void => {
  localStorage.setItem(storageFilterKey(pageKey, organizationId), JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(filtersUpdatedEvent(pageKey, organizationId), { detail: state }))
}

export const saveQuickFilters = (pageKey: TableKeyValue, activeFilter: TQuickFilter, organizationId?: string): void => {
  clearQuickFilters(pageKey, organizationId)

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

  localStorage.setItem(storageQuickFilterKey(pageKey, organizationId), JSON.stringify(quickFilterState))
}

export const clearQuickFilters = (pageKey: TableKeyValue, organizationId?: string): void => {
  localStorage.removeItem(storageQuickFilterKey(pageKey, organizationId))
}

export const loadQuickFilter = (pageKey: TableKeyValue, quickFilters: TQuickFilter[] = [], organizationId?: string): TQuickFilter | null => {
  const activeQuickFilter = quickFilters.find((item) => item.isActive)
  // This is the case when we have active quick filter as default value
  if (activeQuickFilter) {
    clearQuickFilters(pageKey, organizationId)
    saveQuickFilters(pageKey, activeQuickFilter, organizationId)
    return activeQuickFilter
  }

  const saved = localStorage.getItem(storageQuickFilterKey(pageKey, organizationId))
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

export const loadFilters = (pageKey: TableKeyValue, filterFields?: FilterField[], organizationId?: string): TFilterState | null => {
  const saved = localStorage.getItem(storageFilterKey(pageKey, organizationId))
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

export const getFiltersUpdatedEvent = filtersUpdatedEvent

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
      case 'radio':
        if (typeof value === 'boolean') {
          result[key] = value
        }
        break

      case 'sliderNumber':
        if (typeof value === 'number') {
          result[key] = value
        }
        break

      case 'sliderRange': {
        const range = value as TNumberRange
        if (range && typeof range.min === 'number' && typeof range.max === 'number') {
          result[key] = range
        }
        break
      }

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

      case 'dropdownSearchSingleSelect':
      case 'dropdownUserSearch':
        if (typeof value === 'string' && value.trim() !== '') {
          result[key] = value
        }
        break

      case 'dropdownSearchMultiselect': {
        if (Array.isArray(value) && value.length > 0) {
          const filteredValues = value.filter((v) => typeof v === 'string' && v.trim() !== '')
          if (filteredValues.length > 0) {
            result[key] = filteredValues
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
export const isNumberRange = (value: unknown): value is TNumberRange => {
  if (typeof value !== 'object' || value === null) return false
  const range = value as { min?: unknown; max?: unknown }
  return typeof range.min === 'number' && typeof range.max === 'number'
}
