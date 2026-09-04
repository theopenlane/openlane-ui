'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import type { TReportField, TReportOperator } from '@repo/codegen/src/report-schema.generated'
import { operatorLabel, type TReportCombinator, type TReportFilter } from '@/lib/report/report-filters'
import { getFieldOperators, type TLabelled } from '@/lib/report/report-schema'
import ReportFilterValue from './report-filter-value'

type TReportFilterRowProps = {
  filter: TReportFilter
  field: TReportField
  options: TLabelled<TReportField>[]
  combinator: TReportCombinator
  showCombinator: boolean
  onUpdate: (updates: Partial<Omit<TReportFilter, 'id'>>) => void
  onRemove: () => void
}

const ReportFilterRow: React.FC<TReportFilterRowProps> = ({ filter, field, options, combinator, showCombinator, onUpdate, onRemove }) => (
  <div className="flex flex-col gap-1.5 p-2 rounded-md border border-border">
    {showCombinator && <span className="text-xs text-muted-foreground uppercase">{combinator}</span>}
    <div className="flex gap-1 items-center">
      <Select value={filter.field} onValueChange={(value) => onUpdate({ field: value })}>
        <SelectTrigger className="h-8 flex-1 min-w-0 text-sm" aria-label="Filter field">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(({ item, label }) => (
            <SelectItem key={item.name} value={item.name}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" size="icon-sm" aria-label="Remove filter" onClick={onRemove}>
        <X size={14} />
      </Button>
    </div>
    <Select value={filter.operator} onValueChange={(value) => onUpdate({ operator: value as TReportOperator })}>
      <SelectTrigger className="h-8 text-sm" aria-label="Filter operator">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {getFieldOperators(field).map((operator) => (
          <SelectItem key={operator} value={operator}>
            {operatorLabel(operator, field.kind)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <ReportFilterValue field={field} operator={filter.operator} value={filter.value} onChange={(value) => onUpdate({ value })} />
  </div>
)

export default ReportFilterRow
