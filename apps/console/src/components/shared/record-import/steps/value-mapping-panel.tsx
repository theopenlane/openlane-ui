'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { pluralizeWithCount } from '@/utils/strings'
import type { TColumnCellCheck } from '../lib/validate-cells'
import type { TValueMap } from '../lib/types'

const LEAVE_BLANK = '__leave_blank__'

type TValueMappingPanelProps = {
  id: string
  fieldLabel: string
  check: TColumnCellCheck
  valueMap: TValueMap | undefined
  onValueChange: (value: string, target: string | null) => void
}

const selectedOption = (valueMap: TValueMap | undefined, value: string): string => {
  if (!valueMap || !Object.hasOwn(valueMap, value)) return ''
  return valueMap[value] ?? LEAVE_BLANK
}

export const ValueMappingPanel: React.FC<TValueMappingPanelProps> = ({ id, fieldLabel, check, valueMap, onValueChange }) => (
  <div id={id} role="group" aria-label={`Map ${fieldLabel} values`} className="col-span-full rounded-md border bg-secondary p-3">
    <p className="mb-3 text-sm text-muted-foreground">
      These values are not valid for <span className="text-foreground">{fieldLabel}</span>. Choose what each one should import as.
    </p>
    <ul className="flex flex-col gap-2">
      {check.invalidValues.map(({ value, rowIndexes }) => (
        <li key={value} className="grid grid-cols-[minmax(0,1fr)_100px_minmax(180px,240px)] items-center gap-4">
          <span className="truncate font-mono text-sm" title={value}>
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{pluralizeWithCount(rowIndexes.length, 'row')}</span>
          <Select value={selectedOption(valueMap, value)} onValueChange={(next) => onValueChange(value, next === LEAVE_BLANK ? null : next)}>
            <SelectTrigger aria-label={`Import "${value}" as`}>
              <SelectValue placeholder="Choose a value" />
            </SelectTrigger>
            <SelectContent>
              {check.mappableValues?.map((option) => (
                <SelectItem key={option} value={option}>
                  {getEnumLabel(option)}
                </SelectItem>
              ))}
              <SelectItem value={LEAVE_BLANK}>Leave blank</SelectItem>
            </SelectContent>
          </Select>
        </li>
      ))}
    </ul>
  </div>
)
