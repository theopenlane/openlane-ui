import React, { useState, useEffect, useCallback, startTransition } from 'react'
import { ChevronDown, ChevronUp, ListFilter, Plus, Trash2, X } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@repo/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Filter, FilterField, WhereCondition } from '@/types'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles'
import { useDebounce } from '@uidotdev/usehooks'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { format, startOfDay, addDays } from 'date-fns'
import { usePathname, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/utils/date.ts'

const getOperatorsForType = (type: Filter['type']) => {
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

interface TableFilterProps {
  filterFields: FilterField[]
  onFilterChange?: (whereCondition: WhereCondition) => void
}

export const TableFilter: React.FC<TableFilterProps> = ({ filterFields, onFilterChange }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<Filter[] | null>(null)
  const [appliedFilters, setAppliedFilters] = useState<Filter[] | null>(null)
  const [conjunction, setConjunction] = useState<'and' | 'or'>('and')
  const { prefixes, columnName, operator, value } = tableFilterStyles()
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
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      try {
        const parsedFilters = JSON.parse(decodeURIComponent(filtersParam))
        if (Array.isArray(parsedFilters)) {
          setFilters(parsedFilters)
          setAppliedFilters(parsedFilters)
          const hasFilters = Array.isArray(filters) && filters.length > 0
          const params = new URLSearchParams(searchParams.toString())

          hasFilters ? params.set('filters', JSON.stringify(filters)) : params.delete('filters')

          const url = `${pathname}?${params.toString()}`
          router.replace(url)

          onFilterChange?.(generateWhereCondition(parsedFilters, conjunction))
        }
      } catch (err) {
        console.error('Invalid filters in URL', err)
      }
    } else {
      setFilters([])
      setAppliedFilters([])
      onFilterChange?.(generateWhereCondition([], conjunction))
    }
  }, [searchParams])

  const updateFilters = (updatedFilters: Filter[]) => {
    setFilters(updatedFilters)
  }

  const handleSaveFilters = (appliedFilters?: Filter[]) => {
    if (!filters && !appliedFilters) {
      return
    }

    const editedFilters = (appliedFilters ?? filters)!
    const hasFilters = Array.isArray(editedFilters) && editedFilters.length > 0
    const params = new URLSearchParams(searchParams.toString())
    hasFilters ? params.set('filters', JSON.stringify(editedFilters)) : params.delete('filters')
    const url = `${pathname}?${params.toString()}`
    router.replace(url)
    setAppliedFilters(editedFilters)
    onFilterChange?.(generateWhereCondition(editedFilters, conjunction))
  }

  const addFilter = () => {
    if (!filterFields.length) {
      return
    }

    const firstField = filterFields[0]
    updateFilters([
      ...(filters || []),
      {
        field: firstField.key,
        value: '',
        type: firstField.type,
        operator: 'EQ',
      },
    ])
  }

  const resetFilters = () => {
    if (!filterFields.length) return
    const firstField = filterFields[0]
    setFilters([
      {
        field: firstField.key,
        value: '',
        type: firstField.type,
        operator: 'EQ',
      },
    ])
  }

  const handleFilterChange = (index: number, field: Partial<Filter>) => {
    if (filters) {
      setFilters(filters.map((filter, i) => (i === index ? { ...filter, ...field } : filter)))
    }
  }

  const removeFilter = (index: number, isAppliedFilter: boolean = false) => {
    if (isAppliedFilter && appliedFilters) {
      const updatedAppliedFilters = appliedFilters.filter((_, i) => i !== index)
      handleSaveFilters(updatedAppliedFilters)
    }

    if (filters && filters.length === 1) {
      resetFilters()
    }

    if (filters && filters.length > 1) {
      updateFilters(filters.filter((_, i) => i !== index))
    }
  }

  const normalizeFilter = (item: Filter) => {
    return `${item.field.charAt(0).toUpperCase() + item.field.slice(1)} ${getOperatorsForType(item.type)
      .find((op) => op.value === item.operator)
      ?.label.toLowerCase()} ${renderActiveFilterType(item)}`
  }

  const renderActiveFilterType = (filter: Filter) => {
    switch (filter.type) {
      case 'date':
        return formatDate(filter.value)
      default:
        return filter.value
    }
  }

  const renderFilterInput = (filter: Filter, index: number) => {
    const filterField = filterFields.find((f) => f.key === filter.field)
    if (!filterField) return null

    switch (filter.type) {
      case 'text':
      case 'number':
      case 'containsText':
        return <Input className={value()} type={filter.type} placeholder="Enter a value..." value={filter.value} onChange={(e) => handleFilterChange(index, { value: e.target.value })} />
      case 'selectIs':
      case 'select':
        return (
          <Select value={filter.value} onValueChange={(value) => handleFilterChange(index, { value })}>
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
              onChange: (selectedDate) => handleFilterChange(index, { value: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss'Z'") : '' }),
              name: filter.field,
              onBlur: () => {},
              ref: () => {},
            }}
          />
        )
      case 'boolean':
        return (
          <Select value={String(filter.value)} onValueChange={(value) => handleFilterChange(index, { value: value === 'true' })}>
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

  return (
    <div>
      <button className="gap-2 flex items-center py-1.5 px-3 border rounded-lg" onClick={toggleFilterActive}>
        <ListFilter size={16} />
        <p className="text-sm whitespace-nowrap">Filters</p>
        <ChevronUp size={16} />
        <span className="border-l pl-2">
          <span className="bg-background-secondary rounded-md p-1 pl-2 pr-2 text-sm">{appliedFilters?.length}</span>
        </span>
      </button>
      {filtersActive && (
        <div className="absolute mt-2 text-xs leading-6 w-full bg-background-secondary p-2 rounded-lg">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex gap-2 border rounded-lg px-2 py-1 cursor-pointer">
              <Plus size={16} />
              <span className="text-xs">Filter</span>
            </div>
            <Popover onOpenChange={(open) => open && filters?.length === 0 && addFilter()}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 border rounded-lg px-2 py-1 cursor-pointer">
                  <ListFilter size={16} />
                  <span className="text-xs">Advanced</span>
                  <span className="border-l bg-background-secondary pl-2 text-xs">{appliedFilters?.length}</span>
                  <ChevronDown size={16} />
                </div>
              </PopoverTrigger>
              <PopoverContent align="start" side="bottom" sideOffset={8} asChild className="size-fit p-4 ">
                <div className="flex flex-col gap-2">
                  {filters?.map((filter, index) => {
                    const filterField = filterFields.find((f) => f.key === filter.field)
                    const operators = filterField ? getOperatorsForType(filterField.type) : []

                    return (
                      <div key={index} className="flex items-center gap-2">
                        {index === 0 && <p className={prefixes()}>Where</p>}
                        {index === 1 && (
                          <Select value={conjunction} onValueChange={(val: 'and' | 'or') => setConjunction(val)}>
                            <SelectTrigger className={prefixes()}>
                              <SelectValue placeholder="And/Or" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="and">And</SelectItem>
                              <SelectItem value="or">Or</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {index > 1 && <p className={prefixes()}>{conjunction}</p>}
                        <Select
                          value={filter.field}
                          onValueChange={(value) => {
                            const selectedField = filterFields.find((f) => f.key === value)
                            if (selectedField) {
                              handleFilterChange(index, {
                                field: value,
                                type: selectedField.type,
                                value: '',
                                operator: getOperatorsForType(selectedField.type)[0]?.value || 'equals', // Reset to default operator
                              })
                            }
                          }}
                        >
                          <SelectTrigger className={columnName()}>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {filterFields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={filter.operator} onValueChange={(value) => handleFilterChange(index, { operator: value })}>
                          <SelectTrigger className={operator()}>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map((operator) => (
                              <SelectItem key={operator.value} value={operator.value}>
                                {operator.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {renderFilterInput(filter, index)}

                        <Button variant="outline" onClick={() => removeFilter(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveFilters()}>Save</Button>
                    <Button variant="outline" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                    <Button onClick={addFilter}>Add filter rule</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {appliedFilters?.map((item, index) => (
              <div key={index} className="flex items-center border rounded-lg px-2 py-1 max-w-xs">
                <span className="mr-2 truncate text-xs">{normalizeFilter(item)}</span>
                <button className="border-l pl-2" onClick={() => removeFilter(index, true)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
