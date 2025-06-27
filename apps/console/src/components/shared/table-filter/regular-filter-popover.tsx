import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Plus, Trash2, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import React from 'react'
import { Filter, FilterField } from '@/types'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles.tsx'
import { getOperatorsForType, TAppliedFilters } from './table-filter'
import { formatDate } from '@/utils/date.ts'

type TRegularFilterPopover = {
  onAddFilter: (regularFilterItem: Filter) => void
  onHandleFilterChange: (index: number, field: Partial<Filter>) => void
  filters: Filter[] | null
  appliedFilters: TAppliedFilters
  filterFields: FilterField[]
  renderFilterInput: (filter: Filter, index: number, isAdvanced: boolean) => React.ReactNode
  onRemoveFilter: (filter: Filter) => void
  onHandleSaveFilters: () => void
  onResetFilters: () => void
  filter: Filter | null
  index: number
  regularFilterItem: Filter
}

const RegularFilterPopover: React.FC<TRegularFilterPopover> = ({
  onAddFilter,
  onHandleFilterChange,
  filters,
  appliedFilters,
  filterFields,
  renderFilterInput,
  onRemoveFilter,
  onHandleSaveFilters,
  onResetFilters,
  filter,
  regularFilterItem,
  index,
}) => {
  const { prefixes, operator } = tableFilterStyles()
  const filterField = filterFields.find((f) => f.key === filter?.field)
  const operators = filterField ? getOperatorsForType(filterField.type) : []

  const normalizeFilter = (item: Filter) => {
    return `${item.field.charAt(0).toUpperCase() + item.field.slice(1)} ${getOperatorsForType(item.type)
      .find((op) => op.value === item.operator)
      ?.label.toLowerCase()} ${renderActiveFilterType(item)}`
  }

  const renderActiveFilterType = (filter: Filter) => {
    if (filter.type === 'date') {
      return formatDate(filter.value)
    }

    return filter.value
  }

  return (
    <Popover onOpenChange={(open) => open && !filter && onAddFilter(regularFilterItem)}>
      <PopoverTrigger asChild>
        <div className="flex items-center border rounded-lg px-2 py-1 max-w-xs cursor-pointer">
          <span className="mr-2 truncate text-xs">{normalizeFilter(regularFilterItem)}</span>
          <button className="border-l pl-2" onClick={() => onRemoveFilter(regularFilterItem)}>
            <X size={12} />
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={8} asChild className="size-fit p-4 ">
        <div className="flex flex-col gap-2">
          {filter && (
            <div className="flex items-center gap-2">
              <p className={prefixes()}>Where</p>
              <p className="text-sm">{filterFields.find((f) => f.key === filter.field)?.label}</p>

              <Select value={filter.operator} onValueChange={(value) => onHandleFilterChange(index, { operator: value })}>
                <SelectTrigger className="gap-1">
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

              {renderFilterInput(filter, index, false)}

              <Button variant="outline" onClick={() => onRemoveFilter(regularFilterItem)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button className="h-8 !px-2" onClick={() => onHandleSaveFilters()}>
              Save
            </Button>
            <Button variant="back" className="h-8 !px-2" onClick={onResetFilters}>
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default RegularFilterPopover
