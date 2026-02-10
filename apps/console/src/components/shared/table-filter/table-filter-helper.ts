import { TFilterState } from './filter-storage'
import { addDays, format, isSameDay, isValid, startOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Condition, FilterField, WhereCondition } from '@/types'

// For devs: Only 1 quick filter can be active in same time
export type TQuickFilter = {
  label: string
  key: string
  getCondition?: () => TFilterState
  isActive: boolean
  type: 'custom' | 'boolean'
}

export const DateFormatStorage = "yyyy-MM-dd'T'HH:mm:ss'Z'"

export const handleDateEQOperator = (value: Date | string, field: string) => {
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) {
    console.warn(`Invalid date for field "${field}":`, value)
    return []
  }

  const start = format(startOfDay(date), DateFormatStorage)
  const end = format(startOfDay(addDays(date, 1)), DateFormatStorage)
  return [{ [`${field}GTE`]: start }, { [`${field}LT`]: end }]
}

export const handleDateRangeOperator = (range: DateRange, field: string): Condition[] => {
  const conditions: Condition[] = []

  if (!range.from && !range.to) return conditions

  if (!range.from && range.to) {
    const end = format(startOfDay(addDays(range.to, 1)), DateFormatStorage)
    conditions.push({ [`${field}LT`]: end })
    return conditions
  }

  if (range.from && !range.to) {
    const start = format(startOfDay(range.from), DateFormatStorage)
    conditions.push({ [`${field}GTE`]: start })
    return conditions
  }

  if (range.from && range.to) {
    const startDate = range.from < range.to ? range.from : range.to
    const endDate = range.from < range.to ? range.to : range.from
    if (isSameDay(range.from, range.to)) {
      const start = format(startOfDay(startDate), DateFormatStorage)
      const end = format(startOfDay(addDays(startDate, 1)), DateFormatStorage)
      conditions.push({ [`${field}GTE`]: start }, { [`${field}LT`]: end })
    } else {
      const start = format(startOfDay(startDate), DateFormatStorage)
      const end = format(startOfDay(addDays(endDate, 1)), DateFormatStorage)
      conditions.push({ [`${field}GTE`]: start }, { [`${field}LT`]: end })
    }
  }
  return conditions
}

export const getWhereCondition = (filterState: TFilterState, filterFields: FilterField[]): WhereCondition => {
  return getFiltersWhereCondition(filterState, filterFields)
}

export const getQuickFiltersWhereCondition = (quickFilter: TQuickFilter): WhereCondition => {
  const andConditions: WhereCondition[] = []
  const key = quickFilter.key
  const val = quickFilter?.getCondition ? quickFilter?.getCondition() : true

  switch (quickFilter.type) {
    case 'boolean':
      andConditions.push({ [key]: true } as Condition)
      break
    case 'custom':
      andConditions.push(val as Condition)
      break
    default:
      andConditions.push(val as Condition)
      break
  }

  return andConditions.length === 0 ? {} : { and: andConditions }
}

const getFiltersWhereCondition = (filterState: TFilterState, filterFields: FilterField[]): WhereCondition => {
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
      case 'dropdownUserSearch':
        if (val) {
          andConditions.push({
            [key]: [{ userID: val as string }],
          })
        }
        break

      case 'radio':
        andConditions.push({ [key]: val as boolean } as Condition)
        break

      case 'dropdownSearchMultiselect': {
        const valuesArray = Array.isArray(val) ? val : []
        if (valuesArray.length === 0) break
        andConditions.push({ [key]: valuesArray } as Condition)
        break
      }
      case 'dropdownSearchSingleSelect': {
        if (!val) break
        andConditions.push({ [key]: val } as Condition)
        break
      }
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
