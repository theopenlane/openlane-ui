'use client'

import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import type { TReportEntity, TReportOperator } from '@repo/codegen/src/report-schema.generated'
import type { Option } from '@repo/ui/multiple-selector'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { filterableFields, filterOperators, filterPath, negatedRelatedOperator, operatorLabel, type TFilterRecord, type TReportFilter, type TReportFilterField } from '@/lib/report/report-filters'
import { isListChain, labelledFields, type TReportCombinator } from '@/lib/report/report-schema'
import ReportFilterValue from './report-filter-value'

type TReportFilterRowProps = {
  entity: TReportEntity
  filter: TReportFilter
  field: TReportFilterField
  record: TFilterRecord
  recordOptions: Option[]
  combinator: TReportCombinator
  showCombinator: boolean
  onRecordChange: (recordKey: string) => void
  onUpdate: (updates: Partial<Omit<TReportFilter, 'id'>>) => void
  onRemove: () => void
}

const ReportFilterRow: React.FC<TReportFilterRowProps> = ({ entity, filter, field, record, recordOptions, combinator, showCombinator, onRecordChange, onUpdate, onRemove }) => {
  const positive = negatedRelatedOperator(filter.operator, record)
  const hint = positive
    ? `Keeps records where no linked ${record.label} ${operatorLabel(positive, field.kind)} this value`
    : isListChain(record.edges)
      ? `Keeps records with at least one matching ${record.label}${combinator === 'and' ? ' and lists only the matching ones' : ''}`
      : null
  const fieldOptions = useMemo(() => labelledFields(filterableFields(entity, record)), [entity, record])

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-md border border-border">
      {showCombinator && <span className="text-xs text-muted-foreground uppercase">{combinator}</span>}
      {recordOptions.length > 1 && <SearchableSingleSelect ariaLabel="Filter record" value={record.key} options={recordOptions} onChange={onRecordChange} />}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-1 items-center">
        <Select value={filter.field} onValueChange={(value) => onUpdate({ field: value })}>
          <SelectTrigger className="h-8 flex-1 min-w-0 text-sm" aria-label="Filter field">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldOptions.map(({ item, label }) => (
              <SelectItem key={item.name} value={filterPath(record, item)}>
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
          {filterOperators(field).map((operator) => (
            <SelectItem key={operator} value={operator}>
              {operatorLabel(operator, field.kind)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ReportFilterValue field={field} operator={filter.operator} value={filter.value} onChange={(value) => onUpdate({ value })} />
    </div>
  )
}

export default ReportFilterRow
