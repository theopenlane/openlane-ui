import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { ChevronDown, ChevronUp, ListFilter, Plus, Trash2, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import React, { useEffect, useState } from 'react'
import { Filter, FilterField } from '@/types'
import { getOperatorsForType } from './table-filter'

type TAdvancedFilterPopover = {
  onAddFilter: () => void
  onHandleFilterChange: (field: Filter, index: number) => void
  filters: Filter[] | null
  filterFields: FilterField[]
  conjunction: 'and' | 'or'
  onSetConjunction: (conjunction: 'and' | 'or') => void
  renderFilterInput: (filter: Filter, isAdvanced: boolean, onClose: () => void, index: number) => React.ReactNode
  onRemoveFilter: (index: number) => void
  onHandleSaveFilters: () => void
  onResetFilters: () => void
  isActive?: boolean
  onDeleteFilter: () => void
}

const AdvancedFilterPopover: React.FC<TAdvancedFilterPopover> = ({
  onAddFilter,
  onHandleFilterChange,
  filters,
  filterFields,
  conjunction,
  onSetConjunction,
  renderFilterInput,
  onRemoveFilter,
  onDeleteFilter,
  onHandleSaveFilters,
  onResetFilters,
  isActive,
}) => {
  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    if (isActive) {
      setOpen(true)
    }
  }, [isActive])

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
      }}
    >
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 border rounded-lg px-2 py-1 cursor-pointer">
          <ListFilter size={16} />
          <span className="text-xs">Advanced</span>
          <span className="border-l bg-background-secondary pl-2 text-xs">{filters?.length}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <button
            className="border-l pl-2 bg-unset"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteFilter()
            }}
          >
            <X size={12} />
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={8} asChild className="size-fit p-4 pt-2 pb-2">
        <div className="flex flex-col gap-2">
          {filters?.map((filter, index) => {
            const filterField = filterFields.find((f) => f.key === filter.field)
            const operators = filterField ? getOperatorsForType(filterField.type) : []

            return (
              <div key={index} className="flex items-center gap-2">
                {index === 0 && <p className="text-sm">Where</p>}
                {index === 1 && (
                  <Select value={conjunction} onValueChange={(val: 'and' | 'or') => onSetConjunction(val)}>
                    <SelectTrigger className="gap-1 p-1 pl-2 pr-2 min-w-fit w-auto max-w-full h-auto">
                      <SelectValue placeholder="And/Or" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="and">And</SelectItem>
                      <SelectItem value="or">Or</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {index > 1 && <p className="gap-1 p-1 pl-2 pr-2 h-[unset]">{conjunction}</p>}
                <Select
                  value={filter.field}
                  onValueChange={(value) => {
                    const selectedField = filterFields.find((f) => f.key === value)
                    if (selectedField) {
                      onHandleFilterChange(
                        {
                          field: value,
                          type: selectedField.type,
                          value: '',
                          operator: getOperatorsForType(selectedField.type)[0]?.value || 'equals',
                          label: selectedField.label,
                        },
                        index,
                      )
                    }
                  }}
                >
                  <SelectTrigger className="gap-1 p-1 pl-2 pr-2 min-w-fit w-auto max-w-full h-auto">
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

                <Select value={filter.operator} onValueChange={(value) => onHandleFilterChange({ ...filter, operator: value }, index)}>
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

                {renderFilterInput(filter, true, () => setOpen(false), index)}

                <Button className="!gap-1 !p-1 !pl-2 !pr-2 h-[unset]" variant="outline" onClick={() => onRemoveFilter(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
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
            <Button className="h-6 !px-2" variant="back" onClick={onResetFilters}>
              Cancel
            </Button>
            <div className="h-6 flex items-center border rounded-lg gap-2 px-2 py-1 cursor-pointer" onClick={onAddFilter}>
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
