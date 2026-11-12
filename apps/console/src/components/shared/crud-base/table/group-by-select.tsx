'use client'

import React from 'react'
import { Layers } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { tableActionAnchor } from '@/components/shared/element-anchor/element-anchor'

export const GROUP_BY_PARAM = 'groupBy'

export type TGroupByOption = { value: string; label: string }

export type TGroupByControl = {
  options: TGroupByOption[]
  value: string | null
  onChange: (value: string | null) => void
}

const NO_GROUPING = '__none__'

type TGroupBySelectProps = TGroupByControl & { entityType: ObjectTypes }

export const GroupBySelect: React.FC<TGroupBySelectProps> = ({ options, value, onChange, entityType }) => {
  const selected = options.find((option) => option.value === value)

  return (
    <Select value={selected?.value ?? NO_GROUPING} onValueChange={(next) => onChange(next === NO_GROUPING ? null : next)}>
      <SelectTrigger className="h-8 w-fit gap-2 whitespace-nowrap" aria-label="Group by" {...tableActionAnchor(entityType, 'group-by')}>
        <Layers size={16} className="shrink-0" />
        <span>{selected ? `Group by: ${selected.label}` : 'Group by'}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_GROUPING}>No grouping</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
