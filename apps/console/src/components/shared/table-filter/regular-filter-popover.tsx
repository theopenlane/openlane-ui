import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Trash2, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import React, { useEffect, useState } from 'react'
import { Filter, FilterField } from '@/types'
import { getOperatorsForType } from './table-filter'
import { formatDate } from '@/utils/date.ts'

type TRegularFilterPopover = {
  onHandleFilterChange: (filter: Filter) => void
  filterFields: FilterField[]
  renderFilterInput: (filter: Filter, isAdvanced: boolean, onClose: () => void) => React.ReactNode
  onDeleteFilter: (filter: Filter) => void
  onHandleSaveFilters: () => void
  onResetFilters: (filter: Filter) => void
  filter: Filter | null
  regularFilterItem: Filter
  isActive?: boolean
}

const RegularFilterPopover: React.FC<TRegularFilterPopover> = ({
  onHandleFilterChange,
  filterFields,
  renderFilterInput,
  onHandleSaveFilters,
  onResetFilters,
  filter,
  regularFilterItem,
  onDeleteFilter,
  isActive,
}) => {
  const filterField = filterFields.find((f) => f.key === filter?.field)
  const operators = filterField ? getOperatorsForType(filterField.type) : []
  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    if (isActive) {
      setOpen(true)
    }
  }, [isActive])

  const normalizeFilter = (item: Filter) => {
    return `${item.label} ${getOperatorsForType(item.type)
      .find((op) => op.value === item.operator)
      ?.label.toLowerCase()} ${renderActiveFilterType(item)}`
  }

  const renderActiveFilterType = (filter: Filter) => {
    if (filter?.options && filter?.value) {
      return filter.options.find((item) => item.value === filter.value)?.label
    }

    if (filter.type === 'date') {
      return formatDate(filter.value as string)
    }

    return filter.value
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
      }}
    >
      <PopoverTrigger asChild>
        <div className="flex items-center border rounded-lg px-2 py-1 max-w-xs cursor-pointer">
          <span className="mr-2 truncate text-xs">{normalizeFilter(regularFilterItem)}</span>
          <button
            className="border-l pl-2"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteFilter(regularFilterItem)
            }}
          >
            <X size={12} />
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={8} asChild className="size-fit p-4 pt-2 pb-2">
        <div className="flex flex-col gap-2">
          {filter && (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm">{filterFields.find((f) => f.key === filter.field)?.label}</p>

                <Select value={filter.operator} onValueChange={(value) => onHandleFilterChange({ ...filter, operator: value })}>
                  <SelectTrigger className="gap-1 p-1 pl-2 pr-2 w-auto max-w-full h-auto">
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

                {renderFilterInput(filter, false, () => setOpen(false))}

                <Button className="!gap-1 !p-1 !pl-2 !pr-2 h-[unset]" variant="outline" onClick={() => onDeleteFilter(regularFilterItem)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  className="h-6 !px-2"
                  onClick={() => {
                    onHandleSaveFilters()
                    setOpen(false)
                  }}
                >
                  Save
                </Button>
                <Button variant="back" className="h-6 !px-2" onClick={() => onResetFilters(filter)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default RegularFilterPopover
