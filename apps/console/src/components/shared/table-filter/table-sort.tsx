import React, { useEffect, useState } from 'react'
import { ArrowUpDown, ListFilter, Trash2 } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@repo/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'
import { tableFilterStyles } from '@/components/shared/table-filter/table-filter-styles'
import { OrderDirection } from '@repo/codegen/src/schema'

interface TableSortProps<T extends string> {
  sortFields: { key: T; label: string; default?: { key: T; direction: OrderDirection } }[]
  onSortChange?: (sortCondition: { field: T; direction: OrderDirection }[]) => void
}

export const TableSort = <T extends string>({ sortFields, onSortChange }: TableSortProps<T>) => {
  const [sortConditions, setSortConditions] = useState<{ field: T; direction?: OrderDirection }[]>([])
  const { prefixes, columnName, operator } = tableFilterStyles()

  useEffect(() => {
    if (!sortFields) {
      return
    }

    const defaultField = sortFields.find((field) => field.default)
    if (!defaultField) {
      return
    }

    setSortConditions((prev) => {
      if (prev.some((cond) => cond.field === defaultField.key)) {
        return prev
      }

      return [
        ...prev,
        {
          field: defaultField.key,
          direction: defaultField.default?.direction,
        },
      ]
    })
  }, [sortFields])

  useEffect(() => {
    if (sortConditions.every(({ direction }) => direction !== undefined)) {
      onSortChange?.(sortConditions as { field: T; direction: OrderDirection }[])
    }
  }, [sortConditions])

  const addSortCondition = () => {
    if (!sortFields?.length) {
      return
    }

    const firstNonDefaultField = sortFields.find((field) => !field.default)
    if (firstNonDefaultField) {
      setSortConditions((prev) => [...prev, { field: firstNonDefaultField.key, direction: undefined }])
    }
  }

  const resetSortConditions = () => {
    const defaultField = sortFields.find((field) => field.default)
    const defaultSortCondition = defaultField ? [{ field: defaultField.key, direction: defaultField.default!.direction }] : []

    setSortConditions(defaultSortCondition)
  }

  const handleSortChange = (index: number, field: Partial<{ field: T; direction: OrderDirection }>) => {
    setSortConditions((prev) => prev.map((condition, i) => (i === index ? { ...condition, ...field } : condition)))
  }

  const removeSortCondition = (index: number) => {
    setSortConditions((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Popover onOpenChange={(open) => open && sortConditions.length === 0 && addSortCondition()}>
      <PopoverTrigger asChild>
        <button className="gap-2 flex items-center py-1.5 px-3 border rounded-lg">
          <ArrowUpDown size={16} />
          <p className="text-sm whitespace-nowrap">Add Sort</p>
          <div className="border h-4" />
          <p className="text-sm">{sortConditions.filter((sort) => sort.field !== '').length}</p>
        </button>
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
