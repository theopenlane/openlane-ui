import React, { useState, useEffect, useCallback } from 'react'
import { ListFilter, Trash2 } from 'lucide-react'
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
  const [conjunction, setConjunction] = useState<'and' | 'or'>('and')
  const debouncedFilters = useDebounce(filters, 300)
  const { prefixes, columnName, operator, value } = tableFilterStyles()

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
        }
      } catch (err) {
        console.error('Invalid filters in URL', err)
      }
    } else {
      setFilters([])
    }
  }, [searchParams])

  useEffect(() => {
    const hasFilters = Array.isArray(filters) && filters.length > 0
    const params = new URLSearchParams(searchParams.toString())

    hasFilters ? params.set('filters', JSON.stringify(filters)) : params.delete('filters')

    const url = `${pathname}?${params.toString()}`
    router.replace(url)
  }, [filters, router, pathname, searchParams])

  const updateFilters = (updatedFilters: Filter[]) => {
    setFilters(updatedFilters)
  }

  const addFilter = () => {
    if (!filterFields.length) return
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

  useEffect(() => {
    if (debouncedFilters) {
      onFilterChange?.(generateWhereCondition(debouncedFilters, conjunction))
    }
  }, [debouncedFilters, conjunction, onFilterChange, generateWhereCondition])

  const handleFilterChange = (index: number, field: Partial<Filter>) => {
    if (filters) {
      setFilters(filters.map((filter, i) => (i === index ? { ...filter, ...field } : filter)))
    }
  }

  const removeFilter = (index: number) => {
    if (filters) {
      updateFilters(filters.filter((_, i) => i !== index))
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

  return (
    <Popover onOpenChange={(open) => open && filters?.length === 0 && addFilter()}>
      <PopoverTrigger asChild>
        <button className="gap-2 flex items-center py-1.5 px-3 border rounded-lg">
          <ListFilter size={16} />
          <p className="text-sm whitespace-nowrap">Add Filter</p>
          <div className="border h-4" />
          <p className="text-sm">{filters?.filter((filter) => filter.value !== '').length}</p>
        </button>
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
            <Button onClick={addFilter}>Add Filter</Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
