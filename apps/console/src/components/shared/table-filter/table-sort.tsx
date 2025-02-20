import React, { useState } from 'react'
import { ArrowUpDown, Trash2 } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@repo/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles'
import { OrderDirection } from '@repo/codegen/src/schema'

interface TableSortProps<T extends string> {
  sortFields: { key: T; label: string }[]
  onSortChange?: (sortCondition: { field: T; direction: OrderDirection }[]) => void
}

export const TableSort = <T extends string>({ sortFields, onSortChange }: TableSortProps<T>) => {
  const [sortConditions, setSortConditions] = useState<{ field: T; direction?: OrderDirection }[]>([])
  const { prefixes, columnName, operator } = tableFilterStyles()

  const addSortCondition = () => {
    if (!sortFields.length) return
    const firstField = sortFields[0]
    setSortConditions((prev) => [
      ...prev,
      {
        field: firstField.key,
        direction: undefined,
      },
    ])
  }

  const resetSortConditions = () => {
    setSortConditions([])
    onSortChange?.([])
  }

  const handleSortChange = (index: number, field: Partial<{ field: T; direction: OrderDirection }>) => {
    const updatedConditions = sortConditions.map((condition, i) => (i === index ? { ...condition, ...field } : condition))
    setSortConditions(updatedConditions)
    if (updatedConditions.every(({ direction }) => direction !== undefined)) {
      onSortChange?.(updatedConditions as { field: T; direction: OrderDirection }[])
    }
  }

  const removeSortCondition = (index: number) => {
    setSortConditions((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Popover onOpenChange={(open) => open && sortConditions.length === 0 && addSortCondition()}>
      <PopoverTrigger asChild>
        <Button className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Add Sort
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={8} asChild className="size-fit p-4 ">
        <div className="flex flex-col gap-2">
          {sortConditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-2">
              {index === 0 && <p className={prefixes()}>Sort By</p>}
              {index > 0 && <p className={prefixes()}>Then By</p>}
              <Select value={condition.field} onValueChange={(value) => handleSortChange(index, { field: value as T })}>
                <SelectTrigger className={columnName()}>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {sortFields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={condition.direction} onValueChange={(value) => handleSortChange(index, { direction: value as OrderDirection })}>
                <SelectTrigger className={operator()}>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderDirection.ASC}>Ascending</SelectItem>
                  <SelectItem value={OrderDirection.DESC}>Descending</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => removeSortCondition(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={addSortCondition}>Add Sort</Button>
            <Button variant="outline" onClick={resetSortConditions}>
              Reset Sorts
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
