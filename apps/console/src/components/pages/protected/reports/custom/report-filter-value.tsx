'use client'

import React from 'react'
import { Input } from '@repo/ui/input'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import type { TReportField, TReportOperator } from '@repo/codegen/src/report-schema.generated'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { filterValueInput, LIST_VALUE_SEPARATOR, listValues } from '@/lib/report/report-filters'
import { getEnumValues } from '@/lib/report/report-schema'

type TReportFilterValueProps = {
  field: TReportField
  operator: TReportOperator
  value: string
  onChange: (value: string) => void
}

const BOOLEAN_LABELS: Record<string, string> = { true: 'True', false: 'False' }

const ReportFilterValue: React.FC<TReportFilterValueProps> = ({ field, operator, value, onChange }) => {
  const input = filterValueInput(field, operator)

  if (input === 'none') return null

  if (input === 'enumList') {
    const options = getEnumValues(field).map((option) => ({ value: option, label: getEnumLabel(option) }))
    const selected = listValues(value).map((item) => ({ value: item, label: getEnumLabel(item) }))

    return (
      <MultipleSelector
        options={options}
        value={selected}
        onChange={(items) => onChange(items.map((item) => item.value).join(LIST_VALUE_SEPARATOR))}
        placeholder="Select values"
        hidePlaceholderWhenSelected
      />
    )
  }

  if (input === 'enum' || input === 'boolean') {
    const options = input === 'boolean' ? ['true', 'false'] : getEnumValues(field)

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm" aria-label="Filter value">
          <SelectValue placeholder="Select a value" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {input === 'boolean' ? BOOLEAN_LABELS[option] : getEnumLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (input === 'number') {
    return <Input type="number" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Value" aria-label="Filter value" />
  }

  if (input === 'date') {
    return <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} aria-label="Filter value" />
  }

  return <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={input === 'list' ? 'Comma separated values' : 'Value'} aria-label="Filter value" />
}

export default ReportFilterValue
