import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { FilterField } from '@/types'
import type { DateRange } from 'react-day-picker'
import { isValid } from 'date-fns'

export type TFilterValue = string | string[] | number | boolean | Date | DateRange | { from?: Date; to?: Date } | undefined
export type TFilterState = Record<string, TFilterValue>

const STORAGE_PREFIX = 'filters:'

const storageKey = (pageKey: TableFilterKeysEnum) => `${STORAGE_PREFIX}${pageKey}`

export function saveFilters(pageKey: TableFilterKeysEnum, state: TFilterState): void {
  localStorage.setItem(storageKey(pageKey), JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(`filters-updated:${pageKey}`, { detail: state }))
}

export function loadFilters(pageKey: TableFilterKeysEnum, filterFields?: FilterField[]): TFilterState | null {
  const saved = localStorage.getItem(storageKey(pageKey))
  if (!saved) return null

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

    const validated = validateValues(filtered, filterFields)

    return validated
  } catch {
    console.warn(`Invalid filters found in storage for ${pageKey}`)
    return null
  }
}

export function clearFilters(pageKey: TableFilterKeysEnum): void {
  localStorage.removeItem(storageKey(pageKey))
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

      case 'select':
        if (typeof value === 'string' && value !== '') {
          result[key] = value
        }
        break

      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          result[key] = value
        }
        break

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
