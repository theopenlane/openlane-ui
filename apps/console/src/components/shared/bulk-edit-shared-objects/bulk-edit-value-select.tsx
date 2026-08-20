'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { isClearableSelect, type SelectOptionSelectedObject } from './bulk-edit-shared-objects'

const CLEAR_VALUE_LABEL = 'Clear value'

type BulkEditValueSelectProps = {
  selectedObject: SelectOptionSelectedObject
  value?: string | string[]
  onChange: (value: string) => void
}

export const BulkEditValueSelect: React.FC<BulkEditValueSelectProps> = ({ selectedObject, value, onChange }) => {
  const options = selectedObject.options ?? []
  const selectedValue = typeof value === 'string' ? value : undefined

  if (isClearableSelect(selectedObject)) {
    return (
      <div className="w-60">
        <SearchableSingleSelect
          value={selectedValue}
          options={options}
          placeholder={selectedValue === '' ? CLEAR_VALUE_LABEL : selectedObject.placeholder}
          clearable
          clearLabel={CLEAR_VALUE_LABEL}
          onChange={onChange}
        />
      </div>
    )
  }

  return (
    <Select value={selectedValue} onValueChange={onChange}>
      <SelectTrigger className="w-60">
        <SelectValue placeholder={selectedObject.placeholder}>
          <CustomTypeEnumValue value={selectedValue} options={options} placeholder={selectedObject.placeholder} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <CustomTypeEnumOptionChip option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
