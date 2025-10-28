import React, { useCallback, useEffect, useState } from 'react'
import { FilterField, WhereCondition, Condition } from '@/types'
import { Filter, ChevronDown, CalendarIcon } from 'lucide-react'
import { format, startOfDay, addDays, isSameDay, isValid } from 'date-fns'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Switch } from '@repo/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Calendar } from '@repo/ui/calendar'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { Separator as Hr } from '@repo/ui/separator'
import { saveFilters, loadFilters, clearFilters, TFilterState, TFilterValue } from '@/components/shared/table-filter/filter-storage.ts'
import type { DateRange } from 'react-day-picker'
import Slider from '../slider/slider'
import { Checkbox } from '@repo/ui/checkbox'

type TTableFilterProps = {
  filterFields: FilterField[]
  pageKey: TableFilterKeysEnum
  onFilterChange?: (whereCondition: WhereCondition) => void
}

const handleDateEQOperator = (value: Date | string, field: string) => {
  const date = value instanceof Date ? value : new Date(value)
  if (!isValid(date)) {
    console.warn(`Invalid date for field "${field}":`, value)
    return []
  }

  const start = format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const end = format(startOfDay(addDays(date, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  return [{ [`${field}GTE`]: start }, { [`${field}LT`]: end }]
}
const handleDateRangeOperator = (range: DateRange, field: string): Condition[] => {
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

const TableFilterComponent: React.FC<TTableFilterProps> = ({ filterFields, pageKey, onFilterChange }) => {
  const [values, setValues] = useState<TFilterState>({})
  const [open, setOpen] = useState(false)

  const buildWhereCondition = useCallback((vals: TFilterState, fields: FilterField[]): WhereCondition => {
    const andConditions: WhereCondition[] = []

    for (const field of fields) {
      const val = vals[field.key]
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0)) {
        continue
      }

      const key = field.forceKeyOperator
        ? field.key
        : (() => {
            switch (field.type) {
              case 'text':
                return `${field.key}ContainsFold`
              case 'select':
                return `${field.key}In`
              default:
                return field.key
            }
          })()

      switch (field.type) {
        case 'text':
          if (field.childrenObjectKey) {
            andConditions.push({ [key]: { [field.childrenObjectKey!]: val as string } })
          } else {
            andConditions.push({ [key]: val as string })
          }
          break
        case 'multiselect':
        case 'select': {
          const valuesArray = Array.isArray(val) ? val : [val]
          if (valuesArray.length === 0) break

          if (field.childrenObjectKey) {
            const objectArray: { [k: string]: string }[] = valuesArray.map((v) => ({ [field.childrenObjectKey!]: v as string }))
            andConditions.push({ [key]: objectArray } as Condition)
          } else {
            andConditions.push({ [`${key}`]: valuesArray } as Condition)
          }
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
    return andConditions.length === 0 ? {} : { and: andConditions }
  }, [])

  useEffect(() => {
    const saved = loadFilters(pageKey)

    if (saved) {
      // filter out any saved keys that are no longer valid. this can happen if filter fields change over time but user has old saved filters on production
      const validKeys = filterFields.map((f) => f.key)
      const filtered: TFilterState = Object.fromEntries(Object.entries(saved).filter(([key]) => validKeys.includes(key)))

      setValues(filtered)
      onFilterChange?.(buildWhereCondition(filtered, filterFields))
    } else {
      onFilterChange?.({})
    }

    const listener = (e: CustomEvent) => {
      const updated = e.detail as TFilterState

      const validKeys = filterFields.map((f) => f.key)
      const cleaned: TFilterState = Object.fromEntries(Object.entries(updated).filter(([key]) => validKeys.includes(key)))

      setValues(cleaned)
      onFilterChange?.(buildWhereCondition(cleaned, filterFields))
    }

    window.addEventListener(`filters-updated:${pageKey}`, listener as EventListener)
    return () => window.removeEventListener(`filters-updated:${pageKey}`, listener as EventListener)
  }, [pageKey, buildWhereCondition, onFilterChange, filterFields])

  const handleChange = useCallback((key: string, value: TFilterValue) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const applyFilters = useCallback(() => {
    saveFilters(pageKey, values)
    onFilterChange?.(buildWhereCondition(values, filterFields))
    setOpen(false)
  }, [pageKey, values, onFilterChange, buildWhereCondition, filterFields])

  const resetFilters = useCallback(() => {
    setValues({})
    clearFilters(pageKey)
    onFilterChange?.({})
    setOpen(false)
  }, [pageKey, onFilterChange])

  const renderField = useCallback(
    (field: FilterField) => {
      switch (field.type) {
        case 'text':
          return <Input placeholder={`Enter ${field.label}`} value={(values[field.key] as string) ?? ''} onChange={(e) => handleChange(field.key, e.target.value)} />
        case 'select': {
          if (field?.options && (field.options.length < 6 || field.multiple)) {
            const selected = Array.isArray(values[field.key]) ? (values[field.key] as string[]) : []

            return (
              <>
                {field.options.map((opt, index) => (
                  <DropdownMenuCheckboxItem
                    key={`${field.key}-${index}`}
                    className="capitalize"
                    checked={selected.includes(opt.value)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(checked: boolean) => {
                      let next: string[]
                      if (checked) {
                        next = [...selected, opt.value]
                      } else {
                        next = selected.filter((v) => v !== opt.value)
                      }
                      handleChange(field.key, next)
                    }}
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )
          }

          const value = values[field.key]
          const selectValue = Array.isArray(value) ? value[0] : value !== undefined && value !== null ? String(value) : ''

          return (
            <Select value={selectValue} onValueChange={(val: string) => handleChange(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        case 'boolean':
          return (
            <div className="flex items-center gap-2">
              <Switch checked={Boolean(values[field.key])} onCheckedChange={(checked: boolean) => handleChange(field.key, checked)} />
              <span className="text-sm">{field.label}</span>
            </div>
          )
        case 'date':
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !values[field.key] && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {values[field.key] instanceof Date ? format(values[field.key] as Date, 'PPP') : `Pick ${field.label}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar mode="single" selected={values[field.key] as Date | undefined} onSelect={(date) => handleChange(field.key, date)} />
              </PopoverContent>
            </Popover>
          )
        case 'dateRange': {
          const range = (values[field.key] as { from?: Date; to?: Date }) ?? {}

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !range?.from && !range?.to && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {range?.from && range?.to
                    ? `${format(range.from, 'PPP')} - ${format(range.to, 'PPP')}`
                    : range?.from
                    ? `From: ${format(range.from, 'PPP')}`
                    : range?.to
                    ? `To: ${format(range.to, 'PPP')}`
                    : 'Pick date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-4 space-y-4 w-auto">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">From</p>
                    <Calendar mode="single" selected={range.from} onSelect={(date) => handleChange(field.key, { ...range, from: date ?? undefined })} />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">To</p>
                    <Calendar mode="single" selected={range.to} onSelect={(date) => handleChange(field.key, { ...range, to: date ?? undefined })} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        }

        case 'sliderNumber': {
          const currentValue = typeof values[field.key] === 'number' ? (values[field.key] as number) : 0

          return (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{field.min ?? 0}</span>
                <span>{currentValue}</span>
                <span>{field.max ?? 100}</span>
              </div>
              <Slider value={currentValue} onChange={(val: number) => handleChange(field.key, val)} />
            </div>
          )
        }

        case 'multiselect': {
          const selected = Array.isArray(values[field.key]) ? (values[field.key] as string[]) : []
          const handleToggle = (value: string) => {
            const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
            handleChange(field.key, next)
          }

          return (
            <ul className="max-h-40 overflow-y-auto border rounded-lg">
              {field?.options?.length ? (
                field.options.map((opt) => (
                  <li
                    key={opt.value}
                    onChange={() => handleToggle(opt.value)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer text-sm"
                    onClick={() => handleToggle(opt.value)}
                  >
                    <Checkbox checked={selected.includes(opt.value)} className="accent-primary" />
                    <span>{opt.label}</span>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-muted-foreground">No options available</li>
              )}
            </ul>
          )
        }

        default:
          return null
      }
    },
    [values, handleChange],
  )

  const activeFilterCount = Object.values(values).filter((v) => {
    if (v === undefined || v === null || v === '') return false
    if (Array.isArray(v)) return v.length > 0
    return true
  }).length

  const activeFilterKeys = filterFields
    .map((field) => field.key)
    .filter((key) => {
      const v = values[key]
      if (v === undefined || v === null || v === '') return false
      if (Array.isArray(v)) return v.length > 0
      return true
    })

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button icon={<Filter size={16} />} iconPosition="left" variant="outline" size="md" className="size-fit py-1.5 px-2">
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium border border-primary rounded-md text-primary bg-primary-muted">{activeFilterCount}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border shadow-md w-[540px] overflow-y-auto p-0" align="end">
        <p className="text-muted-foreground text-xs p-4 pb-0"> FILTER BY</p>
        <Accordion type="multiple" defaultValue={activeFilterKeys} className="p-4 pb-0">
          {filterFields.map((field) => (
            <AccordionItem key={field.key} value={field.key}>
              <AccordionTrigger asChild>
                <button className="group flex items-center py-2 text-left gap-3 w-full bg-unset">
                  <div className="flex items-center gap-2">
                    <field.icon size={16} className="text-muted-foreground shrink-0" />
                    <span className="text-sm">{field.label}</span>
                  </div>
                  <ChevronDown size={14} className="ml-auto transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0 text-muted-foreground" />
                </button>
              </AccordionTrigger>
              <AccordionContent className="pt-2 ml-5">{renderField(field)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Hr />

        <div className="flex justify-between p-4">
          <Button onClick={resetFilters} variant="outline">
            Reset filters
          </Button>
          <Button variant="outline" className="btn-secondary" onClick={applyFilters}>
            View Results
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const TableFilter = React.memo(TableFilterComponent)
