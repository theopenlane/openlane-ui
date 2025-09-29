import React, { useCallback, useEffect, useState } from 'react'
import { FilterField, WhereCondition, Condition } from '@/types'
import { Filter, ChevronDown, CalendarIcon } from 'lucide-react'
import { format, startOfDay, addDays } from 'date-fns'
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

type TFilterValue = string | string[] | number | boolean | Date | undefined
type TFilterState = Record<string, TFilterValue>

type TTableFilterProps = {
  filterFields: FilterField[]
  pageKey: TableFilterKeysEnum
  onFilterChange?: (whereCondition: WhereCondition) => void
}

const STORAGE_PREFIX = 'filters:'

const handleDateEQOperator = (value: Date, field: string): Condition[] => {
  const start = format(startOfDay(value), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const end = format(startOfDay(addDays(value, 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  return [{ [`${field}GTE`]: start }, { [`${field}LT`]: end }]
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
              case 'boolean':
                return field.key
              case 'date':
                return field.key
              default:
                return field.key
            }
          })()

      switch (field.type) {
        case 'text':
          andConditions.push({ [key]: val as string })
          break

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
      }
    }

    return andConditions.length === 0 ? {} : { and: andConditions }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${pageKey}`)
    if (saved) {
      try {
        const parsed: TFilterState = JSON.parse(saved, (key, value) => {
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return new Date(value)
          }
          return value
        })
        setValues(parsed)
        onFilterChange?.(buildWhereCondition(parsed, filterFields)) // use parsed, not values
        return
      } catch {
        console.log('Filters not passed correctly.')
      }
    }
    onFilterChange?.({})
  }, [pageKey, buildWhereCondition, onFilterChange, filterFields])

  const handleChange = useCallback((key: string, value: TFilterValue) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const renderField = useCallback(
    (field: FilterField) => {
      switch (field.type) {
        case 'text':
          return <Input placeholder={`Enter ${field.label}`} value={(values[field.key] as string) ?? ''} onChange={(e) => handleChange(field.key, e.target.value)} />
        case 'select': {
          if (field?.options && field.options.length < 6) {
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

          return (
            <Select value={(values[field.key] as string) ?? ''} onValueChange={(val: string) => handleChange(field.key, val)}>
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
        default:
          return null
      }
    },
    [values, handleChange],
  )

  const applyFilters = useCallback(() => {
    localStorage.setItem(`${STORAGE_PREFIX}${pageKey}`, JSON.stringify(values))
    onFilterChange?.(buildWhereCondition(values, filterFields))
    setOpen(false)
  }, [pageKey, values, onFilterChange, buildWhereCondition, filterFields])

  const resetFilters = useCallback(() => {
    setValues({})
    localStorage.removeItem(`${STORAGE_PREFIX}${pageKey}`)
    onFilterChange?.({})
    setOpen(false)
  }, [pageKey, onFilterChange])

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
      <DropdownMenuContent className="border shadow-md p-4 w-[540px] overflow-y-auto" align="end">
        <Accordion type="multiple" className="space-y-2" defaultValue={activeFilterKeys}>
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

        <div className="flex justify-between mt-4">
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
