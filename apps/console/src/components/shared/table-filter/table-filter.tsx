import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FilterField, WhereCondition } from '@/types'
import { Filter, ChevronDown, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@repo/ui/input'
import { Switch } from '@repo/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Calendar } from '@repo/ui/calendar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { Separator as Hr } from '@repo/ui/separator'
import { saveFilters, loadFilters, clearFilters, TFilterState, TFilterValue, saveQuickFilters, loadQuickFilter, clearQuickFilters } from '@/components/shared/table-filter/filter-storage.ts'
import Slider from '../slider/slider'
import { Checkbox } from '@repo/ui/checkbox'
import { getActiveFilterCount, getQuickFiltersWhereCondition, getWhereCondition, TQuickFilter } from '@/components/shared/table-filter/table-filter-helper.ts'
import { DropdownSearchField } from '../filter-components/dropdown-search-field'
import { DropdownSearchMultiselect } from '../filter-components/dropdown-search-multiselect-field'

type TTableFilterProps = {
  filterFields: FilterField[]
  pageKey?: TableFilterKeysEnum
  onFilterChange?: (whereCondition: WhereCondition) => void
  quickFilters?: TQuickFilter[]
}

const EMPTY_QUICK_FILTERS: TQuickFilter[] = []

const TableFilterComponent: React.FC<TTableFilterProps> = ({ filterFields, pageKey, onFilterChange, quickFilters = EMPTY_QUICK_FILTERS }) => {
  const [values, setValues] = useState<TFilterState>({})
  const [open, setOpen] = useState(false)
  const [activeQuickFilters, setActiveQuickFilters] = useState<TQuickFilter[]>(quickFilters)
  const activeFilterCount = useMemo(() => getActiveFilterCount(values, activeQuickFilters), [values, activeQuickFilters])
  const storageEnabled = Boolean(pageKey)

  const buildWhereCondition = useCallback((filterState: TFilterState, filterFields: FilterField[]): WhereCondition => {
    return getWhereCondition(filterState, filterFields)
  }, [])

  const buildQuickFilterWhereCondition = useCallback((quickFilter: TQuickFilter): WhereCondition => {
    return getQuickFiltersWhereCondition(quickFilter)
  }, [])

  useEffect(() => {
    if (!storageEnabled || !pageKey) {
      onFilterChange?.({})
      return
    }

    const savedQuickFilter = loadQuickFilter(pageKey, quickFilters)
    const saved = loadFilters(pageKey, filterFields)

    if (savedQuickFilter) {
      const updatedFilters = quickFilters.map((f) => ({
        ...f,
        isActive: f.key === savedQuickFilter.key,
      }))

      setActiveQuickFilters((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(updatedFilters)
        return isSame ? prev : updatedFilters
      })
      onFilterChange?.(buildQuickFilterWhereCondition(savedQuickFilter))
    } else if (saved) {
      setValues((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(saved)
        return isSame ? prev : saved
      })
      onFilterChange?.(buildWhereCondition(saved, filterFields))
    } else {
      onFilterChange?.({})
    }
  }, [pageKey, filterFields, quickFilters, onFilterChange, buildWhereCondition, buildQuickFilterWhereCondition, storageEnabled])

  useEffect(() => {
    if (!storageEnabled || !pageKey) return
    const listener = (e: CustomEvent) => {
      const updated = e.detail as TFilterState
      const validKeys = filterFields.map((f) => f.key)
      const cleaned: TFilterState = Object.fromEntries(Object.entries(updated).filter(([key]) => validKeys.includes(key)))

      setValues((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(cleaned)
        return isSame ? prev : cleaned
      })
      onFilterChange?.(buildWhereCondition(cleaned, filterFields))
    }

    window.addEventListener(`filters-updated:${pageKey}`, listener as EventListener)
    return () => window.removeEventListener(`filters-updated:${pageKey}`, listener as EventListener)
  }, [pageKey, filterFields, onFilterChange, buildWhereCondition, storageEnabled])

  const getActiveQuickFilter = useCallback(() => activeQuickFilters.find((f) => f.isActive), [activeQuickFilters])

  const resetQuickFilters = useCallback(
    (clearStorage: boolean = true) => {
      setActiveQuickFilters((prev) => prev.map((qf) => ({ ...qf, isActive: false })))
      if (clearStorage && storageEnabled && pageKey) {
        clearQuickFilters(pageKey)
      }
    },
    [pageKey, storageEnabled],
  )

  const resetRegularFilters = useCallback(
    (clearStorage: boolean = true) => {
      setValues({})
      if (clearStorage && storageEnabled && pageKey) {
        clearFilters(pageKey)
      }
    },
    [pageKey, storageEnabled],
  )

  const resetFilters = useCallback(() => {
    resetRegularFilters()
    resetQuickFilters()
    onFilterChange?.({})
    setOpen(false)
  }, [resetRegularFilters, resetQuickFilters, onFilterChange])

  const handleQuickFilterSave = useCallback(
    (quickFilter: TQuickFilter) => {
      if (storageEnabled && pageKey) {
        saveQuickFilters(pageKey, quickFilter)
      }
      onFilterChange?.(buildQuickFilterWhereCondition(quickFilter))
      resetRegularFilters()
      setOpen(false)
    },
    [buildQuickFilterWhereCondition, onFilterChange, pageKey, resetRegularFilters, storageEnabled],
  )

  const toggleQuickFilter = useCallback(
    (qf: TQuickFilter) => {
      resetRegularFilters(false)
      setActiveQuickFilters((prev) => prev.map((item) => (item.key === qf.key && item.label === qf.label ? { ...item, isActive: !item.isActive } : { ...item, isActive: false })))

      // Here we check !isActive because it will become true through updating state
      if (!qf.isActive) {
        handleQuickFilterSave(qf)
      } else {
        resetFilters()
      }
    },
    [handleQuickFilterSave, resetFilters, resetRegularFilters],
  )

  const handleChange = useCallback(
    (key: string, value: TFilterValue) => {
      resetQuickFilters(false)
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    [resetQuickFilters],
  )

  const applyFilters = useCallback(() => {
    const activeQuickFilter = getActiveQuickFilter()
    if (activeQuickFilter) {
      handleQuickFilterSave(activeQuickFilter)
    } else {
      if (storageEnabled && pageKey) {
        saveFilters(pageKey, values)
      }
      onFilterChange?.(buildWhereCondition(values, filterFields))
      resetQuickFilters()
    }
    setOpen(false)
  }, [getActiveQuickFilter, handleQuickFilterSave, pageKey, values, onFilterChange, buildWhereCondition, filterFields, resetQuickFilters, storageEnabled])

  const activeFilterKeys = filterFields
    .map((field) => field.key)
    .filter((key) => {
      const v = values[key]
      if (v === undefined || v === null || v === '') return false
      if (Array.isArray(v)) return v.length > 0
      return true
    })

  const renderField = useCallback(
    (field: FilterField) => {
      const val = values[field.key]

      switch (field.type) {
        case 'text':
          return <Input placeholder={`Enter ${field.label}`} value={(val as string) ?? ''} onChange={(e) => handleChange(field.key, e.target.value)} />
        case 'select': {
          const selected = val as string | undefined
          return (
            <ul className="max-h-40 overflow-y-auto border rounded-lg">
              {field.options?.length ? (
                field.options.map((opt) => (
                  <li key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer text-sm" onClick={() => handleChange(field.key, opt.value)}>
                    <Checkbox checked={selected === opt.value} className="accent-primary" />
                    <span>{opt.label}</span>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-muted-foreground">No options available</li>
              )}
            </ul>
          )
        }

        case 'boolean':
          return (
            <div className="flex items-center gap-2">
              <Switch checked={Boolean(val)} onCheckedChange={(checked: boolean) => handleChange(field.key, checked)} />
              <span className="text-sm">{field.label}</span>
            </div>
          )
        case 'date':
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className={cn('w-full justify-start text-left font-normal', !val && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {val instanceof Date ? format(val as Date, 'PPP') : `Pick ${field.label}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar mode="single" selected={val as Date | undefined} onSelect={(date) => handleChange(field.key, date)} />
              </PopoverContent>
            </Popover>
          )
        case 'dateRange': {
          const range = (val as { from?: Date; to?: Date }) ?? {}
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className={cn('w-full justify-start text-left font-normal', !range?.from && !range?.to && 'text-muted-foreground')}>
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
          const currentValue = typeof val === 'number' ? val : 0
          return (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{field.min ?? 0}</span>
                <span>{currentValue}</span>
                <span>{field.max ?? 100}</span>
              </div>
              <Slider value={currentValue} onChange={(v: number) => handleChange(field.key, v)} />
            </div>
          )
        }
        case 'multiselect': {
          const selected = Array.isArray(val) ? (val as string[]) : []
          const handleToggle = (value: string) => handleChange(field.key, selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
          return (
            <ul className="max-h-40 overflow-y-auto border rounded-lg">
              {field.options?.length ? (
                field.options.map((opt) => (
                  <li key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer text-sm" onClick={() => handleToggle(opt.value)}>
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
        case 'dropdownSearch':
          return <DropdownSearchField field={field} value={values[field.key] as string | undefined} onChange={(val) => handleChange(field.key, val)} />

        case 'radio':
          return (
            <div className="flex flex-col gap-1">
              {field.radioOptions?.map((opt) => (
                <label key={String(opt.value)} className={cn('flex items-center gap-2 rounded-md cursor-pointer text-sm transition-colors')} onClick={() => handleChange(field.key, opt.value)}>
                  <div className="relative flex h-4 w-4 items-center justify-center rounded-full border border-primary">{val === opt.value && <div className="h-2 w-2 rounded-full bg-primary" />}</div>
                  {opt.label}
                </label>
              ))}
            </div>
          )

        case 'dropdownSearchMultiselect': {
          const selected = Array.isArray(values[field.key]) ? (values[field.key] as string[]) : []
          return <DropdownSearchMultiselect field={field} value={selected} onChange={(val) => handleChange(field.key, val)} />
        }

        default:
          return null
      }
    },
    [values, handleChange],
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button icon={<Filter size={16} />} iconPosition="left" variant="secondary" size="md" className="size-fit py-1.5 px-2">
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium border border-primary rounded-md text-primary bg-primary-muted">{activeFilterCount}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="border shadow-md w-[540px] max-h-[400px] flex flex-col overflow-hidden" align="end">
        <div className="overflow-y-auto p-0 flex-1">
          {activeQuickFilters.length > 0 && (
            <>
              <p className="text-base p-4 pb-0">Quick Filters</p>
              <div className="flex flex-wrap gap-2 p-4 pb-0">
                {activeQuickFilters.map((qf) => (
                  <Button key={`${qf.key}-${qf.label}`} size="sm" className={`${qf.isActive ? 'is-active' : ''}`} variant="tag" onClick={() => toggleQuickFilter(qf)}>
                    {qf.label}
                  </Button>
                ))}
              </div>
              <Hr className="mt-2" />
            </>
          )}

          <p className="text-muted-foreground text-xs p-4 pt-2 pb-0">FILTER BY</p>
          <Accordion type="multiple" defaultValue={activeFilterKeys} className="p-4 pt-2 pb-0">
            {filterFields.map((field) => (
              <AccordionItem key={field.key} value={field.key}>
                <AccordionTrigger asChild>
                  <button className="group flex items-center py-2 text-left gap-3 w-full bg-unset">
                    <div className="flex items-center gap-2">
                      <field.icon size={16} className="text-muted-foreground shrink-0" />
                      <span className="text-sm">{field.label}</span>
                    </div>
                    <ChevronDown size={14} className="ml-auto transform -rotate-90 transition-transform group-data-[state=open]:rotate-0 text-muted-foreground" />
                  </button>
                </AccordionTrigger>
                <AccordionContent className="pt-2 ml-5">{renderField(field)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <Hr />

        <div className="flex justify-between p-4">
          <Button onClick={resetFilters} variant="secondary">
            Reset filters
          </Button>
          <Button variant="primary" onClick={applyFilters}>
            View Results
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const TableFilter = React.memo(TableFilterComponent)
