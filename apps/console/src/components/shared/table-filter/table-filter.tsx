import React, { useState, useEffect, useCallback, startTransition } from 'react'
import { ChevronDown, ChevronUp, ListFilter, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Filter, FilterField, WhereCondition } from '@/types'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { format, startOfDay, addDays } from 'date-fns'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import AdvancedFilterPopover from '@/components/shared/table-filter/advanced-filter-popover.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import RegularFilterPopover from '@/components/shared/table-filter/regular-filter-popover.tsx'
import FilterPortal from './filter-portal'

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
  const [activeRegularFilterKey, setActiveRegularFilterKey] = useState<string | null>(null)
  const [activeAdvancedFilter, setActiveAdvancedFilter] = useState(false)
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

  const generateWhereCondition = useCallback((regularFilters: Filter[], advancedFilters: Filter[], conjunction: 'and' | 'or') => {
    const conditions = (filters: Filter[]) => {
      return filters
        ?.filter(({ value }) => value !== '')
        .flatMap(({ field, type, operator, value }) => {
          if (field === 'hasProgramsWith') {
            return [{ hasProgramsWith: [{ id: value }] }]
          }
          const operatorMapping = getOperatorsForType(type).find((op) => op.value === operator)
          if (!operatorMapping) return []

          if (type === 'date' && operator === 'EQ') {
            return handleDateEQOperator(value as string, field)
          }

          const queryField = operatorMapping.value !== 'EQ' ? `${field}${operatorMapping.value}` : field
          return [{ [queryField]: value }]
        })
    }

    const regular = conditions(regularFilters)
    const advanced = conditions(advancedFilters)
    const regularCondition = regular.length > 1 ? { and: regular } : regular[0] || null
    const advancedCondition = advanced.length > 1 ? { [conjunction]: advanced } : advanced[0] || null

    if (regularCondition && advancedCondition) {
      return { and: [regularCondition, advancedCondition] }
    }

    return regularCondition || advancedCondition || {}
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

    regularParsedFilters.map((parsedFilter) => {
      const options = filterFields.find((filterField) => filterField.key === parsedFilter.field)?.options
      if (options) {
        parsedFilter.options = options
      }
    })

    setAppliedFilters(appliedFilters)
    setAdvancedFilters(advancedParsedFilters)
    setRegularFilters(regularParsedFilters)
    onFilterChange?.(generateWhereCondition(regularParsedFilters, advancedParsedFilters, conjunction))
  }, [conjunction, generateWhereCondition, onFilterChange, searchParams])

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

  const onSubmitHandler = useCallback(
    (advancedFiltersProp?: Filter[], regularFiltersProp?: Filter[]) => {
      setAppliedFilters((prev) => {
        const currentRegular = regularFiltersProp ?? regularFilters ?? []
        const currentAdvanced = advancedFiltersProp ?? advancedFilters ?? []

        const mergeByField = (prevArr: Filter[], currentArr: Filter[]) => [...currentArr, ...prevArr.filter((prevItem) => !currentArr.some((currItem) => currItem.field === prevItem.field))]

        return {
          ...prev,
          regularFilters: mergeByField(prev.regularFilters ?? [], currentRegular),
          advancedFilters: mergeByField(prev.advancedFilters ?? [], currentAdvanced),
        }
      })

      onFilterChange?.(generateWhereCondition(regularFiltersProp ?? regularFilters ?? [], advancedFiltersProp ?? advancedFilters ?? [], conjunction))
    },
    [advancedFilters, conjunction, generateWhereCondition, onFilterChange, regularFilters],
  )

  const handleSaveAdvancedFilters = useCallback(() => {
    if (!advancedFilters) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    if (advancedFilters.length > 0) {
      params.set('advancedFilters', JSON.stringify(advancedFilters))
    } else {
      params.delete('advancedFilters')
    }
    router.replace(`${pathname}?${params.toString()}`)
    setAdvancedFilters(advancedFilters)
    onSubmitHandler(advancedFilters)
  }, [advancedFilters, onSubmitHandler, pathname, router, searchParams])

  const handleSaveRegularFilters = useCallback(() => {
    if (!regularFilters) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    if (regularFilters.length > 0) {
      params.set('regularFilters', JSON.stringify(regularFilters))
    } else {
      params.delete('regularFilters')
    }
    router.replace(`${pathname}?${params.toString()}`)
    setRegularFilters(regularFilters)
    onSubmitHandler(undefined, regularFilters)
  }, [onSubmitHandler, pathname, regularFilters, router, searchParams])

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

    const filterField = filterFields.find((filterField) => filterField.key === filter.field)
    if (!filterField) {
      return
    }

    const exists = (regularFilters || []).some((f) => f.field === filterField.key)
    if (exists) {
      return
    }

    setRegularFilters([
      ...(regularFilters || []),
      {
        field: filterField.key,
        value: '',
        type: filterField.type,
        operator: getOperatorsForType(filterField.type)[0]?.value || 'equals',
        options: filterField?.options,
      },
    ])
  }

  const handleRemoveAdvancedFilter = (index: number) => {
    if (!advancedFilters) {
      return
    }

    if (advancedFilters.length === 1) {
      handleDeleteAdvancedFilter()
      return
    }

    const updatedAdvancedFilters = advancedFilters.filter((_, i) => i !== index)
    setAdvancedFilters(updatedAdvancedFilters)
  }

  const handleDeleteAdvancedFilter = () => {
    if (!advancedFilters) {
      return
    }

    setAppliedFilters((prev) => ({
      ...prev,
      advancedFilters: [],
    }))
    setAdvancedFilters([])
    onSubmitHandler([])
    const params = new URLSearchParams(searchParams.toString())
    params.delete('advancedFilters')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleDeleteRegularFilter = (filter: Filter) => {
    if (!regularFilters) {
      return
    }

    const editedRegularFilters = appliedFilters.regularFilters.filter((f) => f.field !== filter.field)
    setAppliedFilters((prev) => ({
      ...prev,
      regularFilters: editedRegularFilters,
    }))
    const updatedFilters = regularFilters.filter((regularFilter) => regularFilter.field !== filter.field)
    setRegularFilters(updatedFilters)
    onSubmitHandler(undefined, updatedFilters)
    const params = new URLSearchParams(searchParams.toString())
    if (updatedFilters.length > 0) {
      params.set('regularFilters', JSON.stringify(updatedFilters))
    } else {
      params.delete('regularFilters')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleChangeAdvancedFilter = (filter: Filter, index: number) => {
    if (advancedFilters) {
      const editedAdvancedFilters = advancedFilters.map((advancedFilter, i) => (i === index ? { ...advancedFilter, ...filter } : advancedFilter))
      setAdvancedFilters(editedAdvancedFilters)
    }
  }

  const handleChangeRegularFilter = (filter: Filter) => {
    if (regularFilters) {
      const editedRegularFilters = regularFilters.map((regularFilter) => (filter.field === regularFilter.field ? { ...regularFilter, ...filter } : regularFilter))
      setRegularFilters(editedRegularFilters)
    }
  }

  const resetAdvancedFilters = () => {
    if (!advancedFilters) {
      return
    }

    if (appliedFilters.advancedFilters.length === 1 && appliedFilters.advancedFilters[0].value === '') {
      handleDeleteAdvancedFilter()
      return
    }

    setAdvancedFilters(appliedFilters.advancedFilters)
  }

  const resetRegularFilters = (filter: Filter) => {
    if (!appliedFilters?.regularFilters) {
      return
    }

    const original = appliedFilters.regularFilters.find((f) => f.field === filter.field)
    if (!original) {
      return
    }

    if (original.value === '') {
      handleDeleteRegularFilter(filter)
      return
    }

    setRegularFilters((prev) => {
      if (!prev) {
        return prev
      }
      return prev.map((f) => (f.field === filter.field ? original : f))
    })
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

      setActiveAdvancedFilter(true)
    }

    if (!isAdvanced && filterField) {
      const filterExists = appliedFilters.regularFilters.some((filter) => filter.field === filterField.key)

      if (filterExists) {
        setActiveRegularFilterKey(filterField.key)
        return
      }

      const newFilter: Filter = {
        field: filterField.key,
        value: '',
        type: filterField.type,
        operator: getOperatorsForType(filterField.type)[0]?.value || 'equals',
        options: filterField?.options,
      }

      setAppliedFilters((prevState) => ({
        ...prevState,
        regularFilters: [...prevState.regularFilters, newFilter],
      }))

      setActiveRegularFilterKey(newFilter.field)
      handleAddRegularFilter(newFilter)
    }
  }

  const handleInputFilterChange = useCallback(
    (filter: Filter, isAdvanced: boolean = false, index?: number) => {
      if (!isAdvanced && regularFilters) {
        const changedRegularFilters = regularFilters.map((regularFilter) => (regularFilter.field === filter.field ? { ...regularFilter, ...filter } : regularFilter))
        setRegularFilters(changedRegularFilters)
      }

      if (isAdvanced && advancedFilters) {
        const changedAdvancedFilters = advancedFilters.map((advancedFilter, i) => (advancedFilter.field === filter.field && index === i ? { ...advancedFilter, ...filter } : advancedFilter))
        setAdvancedFilters(changedAdvancedFilters)
      }
    },
    [advancedFilters, regularFilters],
  )

  const getFilterCount = () => {
    return appliedFilters.advancedFilters.length + appliedFilters.regularFilters.length
  }

  const toggleFilterActive = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (params.get('filterActive') === '1') {
        params.delete('filterActive')
      } else {
        params.set('filterActive', '1')
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [searchParams, pathname, router])

  const renderFilterInput = useCallback(
    (filter: Filter, isAdvanced: boolean = false, onClose: () => void, index?: number) => {
      const filterField = filterFields.find((f) => f.key === filter.field)
      if (!filterField) {
        return null
      }

      switch (filter.type) {
        case 'text':
        case 'number':
        case 'containsText':
          return (
            <Input
              className={value()}
              type={filter.type}
              placeholder="Enter a value..."
              value={filter.value as string}
              onChange={(e) => handleInputFilterChange({ ...filter, value: e.target.value }, isAdvanced, index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (isAdvanced) {
                    handleSaveAdvancedFilters()
                  } else {
                    handleSaveRegularFilters()
                  }
                  onClose()
                }
              }}
            />
          )
        case 'selectIs':
        case 'select':
          return (
            <Select value={filter.value as string} onValueChange={(value) => handleInputFilterChange({ ...filter, value: value }, isAdvanced, index)}>
              <SelectTrigger
                className={value()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (isAdvanced) {
                      handleSaveAdvancedFilters()
                    } else {
                      handleSaveRegularFilters()
                    }
                    onClose()
                  }
                }}
              >
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {filterField.options?.map((option) => (
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
              buttonClassName={`${value()} w-40 flex justify-between items-center`}
              defaultToday
              field={{
                value: filter.value ? new Date(filter.value as string) : null,
                onChange: (selectedDate) => handleInputFilterChange({ ...filter, value: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss'Z'") : '' }, isAdvanced, index),
                name: filter.field,
                onBlur: () => {},
                ref: () => {},
              }}
            />
          )
        case 'boolean':
          return (
            <Select value={String(filter.value)} onValueChange={(value) => handleInputFilterChange({ ...filter, value: value === 'true' }, isAdvanced, index)}>
              <SelectTrigger
                className={value()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (isAdvanced) {
                      handleSaveAdvancedFilters()
                    } else {
                      handleSaveRegularFilters()
                    }

                    onClose()
                  }
                }}
              >
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
    [filterFields, handleInputFilterChange, handleSaveAdvancedFilters, handleSaveRegularFilters, value],
  )

  return (
    <div>
      <button className="flex gap-1 size-fit bg-transparent py-1 px-2 border rounded-md items-center" onClick={toggleFilterActive}>
        <ListFilter size={16} />
        <p className="text-sm whitespace-nowrap ">Filters</p>
        {filtersActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span className="border-l pl-2">
          <span className="bg-background-secondary rounded-md p-1 pl-2 pr-2 text-sm">{getFilterCount()}</span>
        </span>
      </button>
      {filtersActive && (
        <FilterPortal>
          <div className="text-xs leading-6 bg-background-secondary p-2 rounded-lg shadow-md transition-all z-50 mb-2">
            <div className="flex items-center flex-wrap gap-2">
              <Menu
                closeOnSelect={true}
                align="start"
                trigger={
                  <div className="flex gap-2 border rounded-lg px-2 py-1 cursor-pointer">
                    <Plus size={16} />
                    <span className="text-xs">Filter</span>
                  </div>
                }
                content={(close) => (
                  <>
                    {filterFields?.map((filterField, index) => (
                      <span
                        key={index}
                        className="text-sm cursor-pointer hover:bg-muted"
                        onClick={() => {
                          handleAddAppliedFilter(false, filterField)
                          close()
                        }}
                      >
                        {filterField?.label}
                      </span>
                    ))}
                  </>
                )}
                extraContent={(close) => (
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted"
                    onClick={() => {
                      handleAddAppliedFilter(true)
                      close()
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <ListFilter size={16} />
                      <span className="text-xs">Advanced</span>
                    </div>
                    <span className="text-xs">{appliedFilters?.advancedFilters.length === 0 ? 'No rules' : `${advancedFilters?.length} ${advancedFilters?.length === 1 ? ' rule' : ' rules'}`}</span>
                  </div>
                )}
              />

              {appliedFilters?.advancedFilters?.length > 0 && (
                <AdvancedFilterPopover
                  onAddFilter={handleAddAdvancedFilter}
                  onHandleFilterChange={handleChangeAdvancedFilter}
                  filters={advancedFilters}
                  filterFields={filterFields}
                  conjunction={conjunction}
                  onSetConjunction={setConjunction}
                  renderFilterInput={renderFilterInput}
                  onRemoveFilter={handleRemoveAdvancedFilter}
                  onDeleteFilter={handleDeleteAdvancedFilter}
                  onHandleSaveFilters={handleSaveAdvancedFilters}
                  onResetFilters={resetAdvancedFilters}
                  isActive={activeAdvancedFilter}
                />
              )}

              {appliedFilters?.regularFilters?.map((regularFilterItem, index) => (
                <RegularFilterPopover
                  key={`regular-${index}`}
                  regularFilterItem={regularFilterItem}
                  filter={regularFilters?.find((regularFilter) => regularFilter.field === regularFilterItem.field) ?? null}
                  onHandleFilterChange={handleChangeRegularFilter}
                  filterFields={filterFields}
                  renderFilterInput={renderFilterInput}
                  onDeleteFilter={handleDeleteRegularFilter}
                  onHandleSaveFilters={handleSaveRegularFilters}
                  onResetFilters={resetRegularFilters}
                  isActive={activeRegularFilterKey === regularFilterItem.field}
                />
              ))}
            </div>
          </div>
        </FilterPortal>
      )}
    </div>
  )
}
