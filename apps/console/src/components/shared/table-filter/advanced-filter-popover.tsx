import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { ChevronDown, ListFilter, Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import React from 'react'
import { Filter, FilterField } from '@/types'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles.tsx'
import { getOperatorsForType, TAppliedFilters } from './table-filter'

type TAdvancedFilterPopover = {
  onAddFilter: () => void
  onHandleFilterChange: (index: number, field: Partial<Filter>) => void
  filters: Filter[] | null
  appliedFilters: TAppliedFilters
  filterFields: FilterField[]
  conjunction: 'and' | 'or'
  onSetConjunction: (conjunction: 'and' | 'or') => void
  renderFilterInput: (filter: Filter, index: number, isAdvanced: boolean) => React.ReactNode
  onRemoveFilter: (index: number) => void
  onHandleSaveFilters: () => void
  onResetFilters: () => void
}

const AdvancedFilterPopover: React.FC<TAdvancedFilterPopover> = ({
  onAddFilter,
  onHandleFilterChange,
  filters,
  appliedFilters,
  filterFields,
  conjunction,
  onSetConjunction,
  renderFilterInput,
  onRemoveFilter,
  onHandleSaveFilters,
  onResetFilters,
}) => {
  const { prefixes, columnName, operator } = tableFilterStyles()

  return (
    <Popover onOpenChange={(open) => open && filters?.length === 0 && onAddFilter()}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 border rounded-lg px-2 py-1 cursor-pointer">
          <ListFilter size={16} />
          <span className="text-xs">Advanced</span>
          <span className="border-l bg-background-secondary pl-2 text-xs">{appliedFilters.advancedFilters.length}</span>
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
                  <Select value={conjunction} onValueChange={(val: 'and' | 'or') => onSetConjunction(val)}>
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
                      onHandleFilterChange(index, {
                        field: value,
                        type: selectedField.type,
                        value: '',
                        operator: getOperatorsForType(selectedField.type)[0]?.value || 'equals',
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

                <Select value={filter.operator} onValueChange={(value) => onHandleFilterChange(index, { operator: value })}>
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

                {renderFilterInput(filter, index, true)}

                <Button variant="outline" onClick={() => onRemoveFilter(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
          <div className="flex gap-2">
            <Button className="h-8 !px-2" onClick={() => onHandleSaveFilters()}>
              Save
            </Button>
            <Button className="h-8 !px-2" variant="back" onClick={onResetFilters}>
              Cancel
            </Button>
            <div className="flex items-center border rounded-lg gap-2 px-2 py-1 cursor-pointer" onClick={onAddFilter}>
              <Plus size={16} />
              <span className="text-sm">Add filter rule</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AdvancedFilterPopover
