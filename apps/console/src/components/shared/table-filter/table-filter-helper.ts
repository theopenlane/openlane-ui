import { TFilterState, TFilterValue } from './filter-storage'
import { addDays, format, isSameDay, isValid, startOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Condition, FilterField, WhereCondition } from '@/types'

export type TQuickFilter = {
  label: string
  key: string
  getCondition?: () => TFilterState
  isActive: boolean
  type: 'custom' | 'boolean'
}

export const mergeQuickFilterConditions = (quickFilters: TQuickFilter[]): Record<string, TFilterValue> => {
  const merged: Record<string, TFilterValue> = {}

  for (const qf of quickFilters) {
    if (!qf.isActive) continue

    const condition = qf.getCondition ? qf.getCondition() : { [qf.key]: true }

    for (const [key, value] of Object.entries(condition)) {
      const existing = merged[key]

      if (existing === undefined) {
        merged[key] = value
      } else if (Array.isArray(existing) && Array.isArray(value)) {
        merged[key] = Array.from(new Set([...existing, ...value])) as TFilterValue
      } else if (Array.isArray(existing)) {
        merged[key] = Array.from(new Set([...existing, value])) as TFilterValue
      } else if (Array.isArray(value)) {
        merged[key] = Array.from(new Set([existing, ...value])) as TFilterValue
      } else {
        merged[key] = value
      }
    }
  }

  return merged
}

export const applyQuickFiltersToState = (baseValues: TFilterState, quickFilters: TQuickFilter[]): TFilterState => {
  const merged = mergeQuickFilterConditions(quickFilters)
  const newValues: TFilterState = { ...baseValues, ...merged }

  for (const qf of quickFilters) {
    if (!qf.isActive && !Object.prototype.hasOwnProperty.call(merged, qf.key)) {
      delete newValues[qf.key]
    }
  }

  return newValues
}

export const updateQuickFilterState = (quickFilters: TQuickFilter[], savedState?: TFilterState | null): TQuickFilter[] => {
  if (!savedState) return quickFilters.map((qf) => ({ ...qf, isActive: false }))

  return quickFilters.map((qf) => ({
    ...qf,
    isActive: qf.key in savedState,
  }))
}

export const handleDateEQOperator = (value: Date | string, field: string) => {
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) {
    console.warn(`Invalid date for field "${field}":`, value)
    return []
  }

  const start = format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const end = format(startOfDay(addDays(date, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  return [{ [`${field}GTE`]: start }, { [`${field}LT`]: end }]
}

export const handleDateRangeOperator = (range: DateRange, field: string): Condition[] => {
  const conditions: Condition[] = []

  if (!range.from && !range.to) return conditions

  if (!range.from && range.to) {
    const end = format(startOfDay(addDays(range.to, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
    conditions.push({ [`${field}LT`]: end })
    return conditions
  }

  if (range.from && !range.to) {
    const start = format(startOfDay(range.from), "yyyy-MM-dd'T'HH:mm:ss'Z'")
    conditions.push({ [`${field}GTE`]: start })
    return conditions
  }

  if (range.from && range.to) {
    const startDate = range.from < range.to ? range.from : range.to
    const endDate = range.from < range.to ? range.to : range.from
    if (isSameDay(range.from, range.to)) {
      const start = format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      const end = format(startOfDay(addDays(startDate, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      conditions.push({ [`${field}GTE`]: start }, { [`${field}LT`]: end })
    } else {
      const start = format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      const end = format(startOfDay(addDays(endDate, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      conditions.push({ [`${field}GTE`]: start }, { [`${field}LT`]: end })
    }
  }
  return conditions
}

export const getWhereCondition = (filterState: TFilterState, filterFields: FilterField[], quickFilters: TQuickFilter[]): WhereCondition => {
  const andConditions: WhereCondition[] = []

  for (const field of filterFields) {
    const key = field.key
    const val = filterState[field.key]
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0)) {
      continue
    }

    switch (field.type) {
      case 'text':
        andConditions.push({ [key]: val as string })
        break
      case 'multiselect': {
        const valuesArray = Array.isArray(val) ? val : [val]
        if (valuesArray.length === 0) break
        andConditions.push({ [key]: valuesArray } as Condition)
        break
      }

      case 'select': {
        andConditions.push({ [key]: val as string })
        break
      }

      case 'boolean':
        andConditions.push({ [key]: val as boolean } as Condition)
        break

      case 'date': {
        const dateVal = val instanceof Date ? val : new Date(val as string)
        andConditions.push(...handleDateEQOperator(dateVal, key))
        break
      }
      case 'dateRange': {
        const rangeVal = val as DateRange | undefined

        if (rangeVal?.from || rangeVal?.to) {
          andConditions.push(...handleDateRangeOperator(rangeVal, key))
        }
        break
      }
      case 'sliderNumber':
        andConditions.push({ [field.key]: val as number })
        break
    }
  }

  for (const field of quickFilters) {
    const key = field.key
    const val = filterState[field.key]

    // skip if value is empty
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0)) {
      continue
    }

    // skip if key already exists in andConditions
    const exists = andConditions.some((cond) => key in cond)
    if (exists) continue

    switch (field.type) {
      case 'boolean':
        andConditions.push({ [key]: val as boolean } as Condition)
        break
      case 'custom':
        andConditions.push({ [key]: val } as Condition)
        break
      default:
        andConditions.push({ [key]: val } as Condition)
        break
    }
  }

  return andConditions.length === 0 ? {} : { and: andConditions }
}

export const getActiveFilterCount = (values: TFilterState, quickFilters: TQuickFilter[]): number => {
  const activeQuick = quickFilters.filter((qf) => qf.isActive)
  const quickKeys = new Set(activeQuick.map((qf) => qf.key))

  const manualCount = Object.entries(values).reduce((count, [key, v]) => {
    if (quickKeys.has(key)) return count
    if (v === undefined || v === null || v === '') return count
    if (Array.isArray(v)) return count + (v.length > 0 ? 1 : 0)
    return count + 1
  }, 0)

  return manualCount + activeQuick.length
}
