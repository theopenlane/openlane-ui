import React, { useState, useEffect, useCallback, startTransition } from 'react'
import { ChevronDown, ChevronUp, ListFilter, Plus, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Filter, FilterField, WhereCondition } from '@/types'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { format, startOfDay, addDays } from 'date-fns'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/utils/date.ts'
import AdvancedFilterPopover from '@/components/shared/table-filter/advanced-filter-popover.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import RegularFilterPopover from '@/components/shared/table-filter/regular-filter-popover.tsx'

export const getOperatorsForType = (type: Filter['type']) => {
  const operatorMap = {
    containsText: [{ value: 'Contains', label: 'Contains' }],
    text: [
      { value: 'EQ', label: 'Is' },
      { value: 'Contains', label: 'Contains' },
      { value: 'HasPrefix', label: 'Starts With' },
      { value: 'HasSuffix', label: 'Ends With' },
    ],
    boolean: [
      { value: 'EQ', label: 'Is' },
      { value: 'NEQ', label: 'Is Not' },
    ],
    select: [
      { value: 'EQ', label: 'Is' },
      { value: 'NEQ', label: 'Is Not' },
    ],
    selectIs: [{ value: 'EQ', label: 'Is' }],
    number: [
      { value: 'EQ', label: 'Is' },
      { value: 'GT', label: 'Greater Than' },
      { value: 'LT', label: 'Less Than' },
    ],
    date: [
      { value: 'EQ', label: 'Is' },
      { value: 'GT', label: 'Is After' },
      { value: 'LT', label: 'Is Before' },
    ],
  }
  return operatorMap[type] || []
}

export type TAppliedFilters = {
  regularFilters: Filter[]
  advancedFilters: Filter[]
}

type TTableFilterProps = {
  filterFields: FilterField[]
  onFilterChange?: (whereCondition: WhereCondition) => void
}

export const TableFilter: React.FC<TTableFilterProps> = ({ filterFields, onFilterChange }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [regularFilters, setRegularFilters] = useState<Filter[] | null>(null)
  const [advancedFilters, setAdvancedFilters] = useState<Filter[] | null>(null)
  const [appliedFilters, setAppliedFilters] = useState<TAppliedFilters>({
    advancedFilters: [],
    regularFilters: [],
  })
  const [conjunction, setConjunction] = useState<'and' | 'or'>('and')
  const { value } = tableFilterStyles()
  const filtersActive = searchParams.get('filterActive') === '1'

  const handleDateEQOperator = (value: string, field: string) => {
    const start = format(startOfDay(new Date(value)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
    const end = format(startOfDay(addDays(new Date(value), 1)), "yyyy-MM-dd'T'HH:mm:ss'Z'")
    return [{ [`${field}GTE`]: start }, { [`${field}LT`]: end }]
  }

  const generateWhereCondition = useCallback((filters: Filter[], conjunction: 'and' | 'or') => {
    const conditions = filters
      ?.filter(({ value }) => value !== '')
      .flatMap(({ field, type, operator, value }) => {
        if (field === 'hasProgramsWith') {
          return [{ hasProgramsWith: [{ id: value }] }]
        }

        const operatorMapping = getOperatorsForType(type).find((op) => op.value === operator)
        if (!operatorMapping) return []

        if (type === 'date' && operator === 'EQ') {
          return handleDateEQOperator(value, field)
        }

        const queryField = operatorMapping.value !== 'EQ' ? `${field}${operatorMapping.value}` : field
        return [{ [queryField]: value }]
      })

    return conditions.length > 1 ? { [conjunction]: conditions } : conditions[0] || {}
  }, [])

  useEffect(() => {
    const advancedFilterParams = searchParams.get('advancedFilters')
    const regularFilterParams = searchParams.get('regularFilters')
    const advancedParsedFilters = advancedFilterParams ? handleParseURLFilter(advancedFilterParams) : []
    const regularParsedFilters = regularFilterParams ? handleParseURLFilter(regularFilterParams) : []
    const appliedFilters: TAppliedFilters = {
      regularFilters: regularParsedFilters,
      advancedFilters: advancedParsedFilters,
    }

    setAppliedFilters(appliedFilters)
    setAdvancedFilters(advancedParsedFilters)
    setRegularFilters(regularParsedFilters)
    onFilterChange?.(generateWhereCondition([...advancedParsedFilters, ...regularParsedFilters], conjunction))
  }, [])

  const handleParseURLFilter = (searchParam: string) => {
    try {
      const parsedFilters = JSON.parse(decodeURIComponent(searchParam))
      if (Array.isArray(parsedFilters)) {
        return parsedFilters
      }

      return []
    } catch (err) {
      console.error('Invalid filters in URL', err)
      return []
    }
  }

  const onSubmitHandler = (advancedFiltersProp?: Filter[], regularFiltersProp?: Filter[]) => {
    const extractedFilters = [...(advancedFiltersProp ?? advancedFilters ?? []), ...(regularFiltersProp ?? regularFilters ?? [])]
    onFilterChange?.(generateWhereCondition(extractedFilters, conjunction))
  }

  const handleSaveAdvancedFilters = () => {
    if (!advancedFilters) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    advancedFilters.length > 0 ? params.set('advancedFilters', JSON.stringify(advancedFilters)) : params.delete('advancedFilters')
    router.replace(`${pathname}?${params.toString()}`)
    setAdvancedFilters(advancedFilters)
    onSubmitHandler(advancedFilters)
  }

  const handleSaveRegularFilters = () => {
    if (!regularFilters) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    regularFilters.length > 0 ? params.set('regularFilters', JSON.stringify(regularFilters)) : params.delete('regularFilters')
    router.replace(`${pathname}?${params.toString()}`)
    setRegularFilters(regularFilters)
    onSubmitHandler(undefined, regularFilters)
  }

  const handleAddAdvancedFilter = () => {
    if (!filterFields.length) {
      return
    }

    const firstField = filterFields[0]
    setAdvancedFilters([
      ...(advancedFilters || []),
      {
        field: firstField.key,
        value: '',
        type: firstField.type,
        operator: 'EQ',
      },
    ])
  }

  const handleAddRegularFilter = (filter: Filter) => {
    if (!filterFields.length) {
      return
    }

    const filterField = filterFields.find((filterField) => filterField.key === filter.field)!
    setRegularFilters([
      ...(regularFilters || []),
      {
        field: filterField.key,
        value: '',
        type: filterField.type,
        operator: 'EQ',
      },
    ])
  }

  const handleRemoveAdvancedFilter = (index: number) => {
    if (!advancedFilters) {
      return
    }

    if (advancedFilters.length === 1) {
      const firstField = filterFields[0]
      setAdvancedFilters([
        {
          field: firstField.key,
          value: '',
          type: firstField.type!,
          operator: 'EQ',
        },
      ])
      return
    }

    const updatedAdvancedFilters = advancedFilters.filter((_, i) => i !== index)
    setAdvancedFilters(updatedAdvancedFilters)
  }

  const handleRemoveRegularFilter = (filter: Filter) => {
    if (!regularFilters) {
      return
    }

    const updatedFilters = regularFilters.map((regularFilter) => (regularFilter.field === filter.field ? { ...regularFilter, value: '' } : filter))
    setRegularFilters(updatedFilters)
  }

  const handleChangeAdvancedFilter = (index: number, field: Partial<Filter>) => {
    if (advancedFilters) {
      const editedAdvancedFilters = advancedFilters.map((filter, i) => (i === index ? { ...filter, ...field } : filter))
      setAdvancedFilters(editedAdvancedFilters)
    }
  }

  const handleChangeRegularFilter = (index: number, field: Partial<Filter>) => {
    if (regularFilters) {
      const editedAdvancedFilters = regularFilters.map((filter, i) => (i === index ? { ...filter, ...field } : filter))
      setRegularFilters(editedAdvancedFilters)
    }
  }

  const resetAdvancedFilters = () => {
    if (!filterFields.length) {
      return
    }

    const firstField = filterFields[0]
    setAdvancedFilters([
      {
        field: firstField.key,
        value: '',
        type: firstField.type,
        operator: 'EQ',
      },
    ])
  }

  const handleAddAppliedFilter = (isAdvanced: boolean = false, filterField?: FilterField) => {
    if (isAdvanced && appliedFilters.advancedFilters.length === 0) {
      handleAddAdvancedFilter()
      setAppliedFilters((prevState) => {
        const firstField = filterFields[0]!
        const newFilter: Filter = {
          field: firstField.key,
          value: '',
          type: firstField.type,
          operator: 'EQ',
        }

        return {
          ...prevState,
          advancedFilters: [...prevState.advancedFilters, newFilter],
        }
      })
    }

    if (!isAdvanced && filterField) {
      setAppliedFilters((prevState) => {
        const filterExists = prevState.regularFilters.some((filter) => filter.field === filterField.key)

        if (filterExists) {
          return prevState
        }

        const newFilter: Filter = {
          field: filterField.key,
          value: '',
          type: filterField.type,
          operator: 'EQ',
        }

        return {
          ...prevState,
          regularFilters: [...prevState.regularFilters, newFilter],
        }
      })
    }
  }

  const handleInputFilterChange = (index: number, field: Partial<Filter>, isAdvanced: boolean = false) => {
    if (!isAdvanced && regularFilters) {
      const changedRegularFilters = regularFilters.map((filter, i) => (i === index ? { ...filter, ...field } : filter))
      setRegularFilters(changedRegularFilters)
    }

    if (isAdvanced && advancedFilters) {
      const changedAdvancedFilters = advancedFilters.map((filter, i) => (i === index ? { ...filter, ...field } : filter))
      setAdvancedFilters(changedAdvancedFilters)
    }
  }

  const getFilterCount = () => {
    return appliedFilters.advancedFilters.length + appliedFilters.regularFilters.length
  }

  const toggleFilterActive = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.get('filterActive') === '1' ? params.delete('filterActive') : params.set('filterActive', '1')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [searchParams, pathname, router])

  const renderFilterInput = useCallback(
    (filter: Filter, index: number, isAdvanced: boolean = false) => {
      const filterField = filterFields.find((f) => f.key === filter.field)
      if (!filterField) {
        return null
      }

      switch (filter.type) {
        case 'text':
        case 'number':
        case 'containsText':
          return (
            <Input className={value()} type={filter.type} placeholder="Enter a value..." value={filter.value} onChange={(e) => handleInputFilterChange(index, { value: e.target.value }, isAdvanced)} />
          )
        case 'selectIs':
        case 'select':
          return (
            <Select value={filter.value} onValueChange={(value) => handleInputFilterChange(index, { value }, isAdvanced)}>
              <SelectTrigger className={value()}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {filterField.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        case 'date':
          return (
            <CalendarPopover
              defaultToday
              field={{
                value: filter.value ? new Date(filter.value) : null,
                onChange: (selectedDate) => handleInputFilterChange(index, { value: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss'Z'") : '' }, isAdvanced),
                name: filter.field,
                onBlur: () => {},
                ref: () => {},
              }}
            />
          )
        case 'boolean':
          return (
            <Select value={String(filter.value)} onValueChange={(value) => handleInputFilterChange(index, { value: value === 'true' }, isAdvanced)}>
              <SelectTrigger className={value()}>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          )
        default:
          return null
      }
    },
    [filterFields, handleInputFilterChange],
  )

  return (
    <div>
      <button className="gap-2 flex items-center py-1.5 px-3 border rounded-lg" onClick={toggleFilterActive}>
        <ListFilter size={16} />
        <p className="text-sm whitespace-nowrap">Filters</p>
        {filtersActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span className="border-l pl-2">
          <span className="bg-background-secondary rounded-md p-1 pl-2 pr-2 text-sm">{getFilterCount()}</span>
        </span>
      </button>
      <div
        className={`absolute mt-2 text-xs leading-6 w-full bg-background-secondary p-2 rounded-lg shadow-md transition-all duration-300 ease-in-out transform
          ${filtersActive ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
        `}
      >
        <div className="flex items-center flex-wrap gap-2">
          <Menu
            align="start"
            trigger={
              <div className="flex gap-2 border rounded-lg px-2 py-1 cursor-pointer">
                <Plus size={16} />
                <span className="text-xs">Filter</span>
              </div>
            }
            content={
              <>
                {filterFields?.map((filterField, index) => {
                  return (
                    <span key={index} className="text-sm cursor-pointer hover:bg-muted" onClick={() => handleAddAppliedFilter(false, filterField)}>
                      {filterField?.label}
                    </span>
                  )
                })}
                <div className="flex items-center gap-2 border rounded-lg px-2 py-1 cursor-pointer" onClick={() => handleAddAppliedFilter(true)}>
                  <ListFilter size={16} />
                  <span className="text-xs">Advanced</span>
                  <span className="border-l bg-background-secondary pl-2 text-xs">{appliedFilters?.advancedFilters.length}</span>
                  <ChevronDown size={16} />
                </div>
              </>
            }
          />

          {appliedFilters?.advancedFilters?.length > 0 && (
            <AdvancedFilterPopover
              onAddFilter={handleAddAdvancedFilter}
              appliedFilters={appliedFilters}
              onHandleFilterChange={handleChangeAdvancedFilter}
              filters={advancedFilters}
              filterFields={filterFields}
              conjunction={conjunction}
              onSetConjunction={setConjunction}
              renderFilterInput={renderFilterInput}
              onRemoveFilter={handleRemoveAdvancedFilter}
              onHandleSaveFilters={handleSaveAdvancedFilters}
              onResetFilters={resetAdvancedFilters}
            />
          )}

          {appliedFilters?.regularFilters?.map((regularFilterItem, index) => (
            <RegularFilterPopover
              key={`regular-${index}`}
              regularFilterItem={regularFilterItem}
              filter={regularFilters?.find((regularFilter) => regularFilter.field === regularFilterItem.field) ?? null}
              index={index}
              onHandleFilterChange={handleChangeRegularFilter}
              filters={regularFilters}
              filterFields={filterFields}
              renderFilterInput={renderFilterInput}
              onRemoveFilter={handleRemoveRegularFilter}
              onHandleSaveFilters={handleSaveRegularFilters}
              onResetFilters={resetAdvancedFilters}
              onAddFilter={handleAddRegularFilter}
              appliedFilters={appliedFilters}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
