'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ListFilter, Trash2 } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@repo/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Filter, FilterField, WhereCondition } from '@/types'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles'

const getOperatorsForType = (type: Filter['type']) => {
  switch (type) {
    case 'text':
      return [
        { value: 'is', label: 'Is', fieldSuffix: '' },
        { value: 'contains', label: 'Contains', fieldSuffix: 'Contains' },
        { value: 'startsWith', label: 'Starts With', fieldSuffix: 'HasPrefix' },
        { value: 'endsWith', label: 'Ends With', fieldSuffix: 'HasSuffix' },
      ]
    case 'boolean':
      return [
        { value: 'is', label: 'Is', fieldSuffix: '' },
        { value: 'isNot', label: 'Is Not', fieldSuffix: 'NEQ' },
      ]
    case 'select':
      return [
        { value: 'is', label: 'Is', fieldSuffix: '' },
        { value: 'isNot', label: 'Is Not', fieldSuffix: 'NEQ' },
      ]
    case 'number':
      return [
        { value: 'is', label: 'Is', fieldSuffix: '' },
        { value: 'greaterThan', label: 'Greater Than', fieldSuffix: 'GT' },
        { value: 'lessThan', label: 'Less Than', fieldSuffix: 'LT' },
      ]
    case 'date':
      return [
        { value: 'is', label: 'Is', fieldSuffix: '' },
        { value: 'isAfter', label: 'Is After', fieldSuffix: 'GT' },
        { value: 'isBefore', label: 'Is Before', fieldSuffix: 'LT' },
      ]
    default:
      return []
  }
}

interface DataTableFilterListProps {
  filterFields: FilterField[]
  onFilterChange?: (whereCondition: WhereCondition) => void
}

export const DataTableFilterList: React.FC<DataTableFilterListProps> = ({ filterFields, onFilterChange }) => {
  const [filters, setFilters] = useState<Filter[]>([])
  const [conjunction, setConjunction] = useState<'and' | 'or'>('and')

  const { prefixes, columnName, operator, value } = tableFilterStyles()

  const generateWhereCondition = (filters: Filter[], conjunction: 'and' | 'or') => {
    const conditions = filters
      .filter((filter) => filter.value !== '')
      .map(({ field, operator, value }) => {
        const operatorMapping = getOperatorsForType('text').find((op) => op.value === operator)

        if (!operatorMapping) return {}

        const queryField = operatorMapping.fieldSuffix ? `${field}${operatorMapping.fieldSuffix}` : field

        return { [queryField]: value }
      })

    return conditions.length > 1 ? { [conjunction]: conditions } : conditions[0] || {}
  }

  const updateFilters = (updatedFilters: Filter[]) => {
    setFilters(updatedFilters)
    onFilterChange?.(generateWhereCondition(updatedFilters, conjunction))
  }

  const addFilter = () => {
    if (!filterFields.length) return
    const firstField = filterFields[0]
    updateFilters([
      ...filters,
      {
        id: crypto.randomUUID(),
        field: firstField.key,
        value: '',
        type: firstField.type,
        operator: getOperatorsForType(firstField.type)[0]?.value || 'equals',
      },
    ])
  }

  const resetFilters = () => {
    updateFilters([])
    addFilter()
  }

  const updateFilter = (index: number, field: Partial<Filter>) => {
    updateFilters(filters.map((filter, i) => (i === index ? { ...filter, ...field } : filter)))
  }

  const removeFilter = (index: number) => {
    updateFilters(filters.filter((_, i) => i !== index))
  }

  const renderFilterInput = (filter: Filter, index: number) => {
    const filterField = filterFields.find((f) => f.key === filter.field)
    if (!filterField) return null

    switch (filter.type) {
      case 'text':
      case 'number':
        return <Input className={value()} type={filter.type} placeholder="Enter a value..." value={filter.value} onChange={(e) => updateFilter(index, { value: e.target.value })} />
      case 'select':
        return (
          <Select value={filter.value} onValueChange={(value) => updateFilter(index, { value })}>
            <SelectTrigger className={value()}>
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
        return <Input className={value()} type="date" value={filter.value} onChange={(e) => updateFilter(index, { value: e.target.value })} />
      case 'boolean':
        return (
          <Select value={String(filter.value)} onValueChange={(value) => updateFilter(index, { value: value === 'true' })}>
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
    <Popover onOpenChange={(open) => open && filters.length === 0 && addFilter()}>
      <PopoverTrigger asChild>
        <Button className="gap-2">
          <ListFilter className="h-4 w-4" />
          Add Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={8} asChild className="size-fit p-4 ">
        <div className="flex flex-col gap-2">
          {filters.map((filter, index) => {
            const filterField = filterFields.find((f) => f.key === filter.field)
            const operators = filterField ? getOperatorsForType(filterField.type) : []

            return (
              <div key={filter.id} className="flex items-center gap-2">
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
                      updateFilter(index, {
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

                <Select value={filter.operator} onValueChange={(value) => updateFilter(index, { operator: value })}>
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
