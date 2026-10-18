'use client'

import React, { memo, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import { labelledFields, type TReportCombinator } from '@/lib/report/report-schema'
import { filterableFields, filterOperators, filterPath, filterRecords, filterValueInput, MAX_FILTERS, resolveFilterField, type TFilterRecord, type TReportFilter } from '@/lib/report/report-filters'
import ReportPanel from './report-panel'
import ReportFilterRow from './report-filter-row'

type TReportFiltersPanelProps = {
  entity: TReportEntity
  filters: TReportFilter[]
  combinator: TReportCombinator
  onCombinatorChange: (combinator: TReportCombinator) => void
  onChange: (filters: TReportFilter[]) => void
}

const ReportFiltersPanel: React.FC<TReportFiltersPanelProps> = ({ entity, filters, combinator, onCombinatorChange, onChange }) => {
  const records = useMemo(() => filterRecords(entity), [entity])
  const recordsByPath = useMemo(() => new Map(records.map((record) => [record.path, record])), [records])
  const recordsByKey = useMemo(() => new Map(records.map((record) => [record.key, record])), [records])
  const recordOptions = useMemo(() => records.map((record) => ({ value: record.key, label: record.label })), [records])

  const firstFilterFor = (record: TFilterRecord): Omit<TReportFilter, 'id'> | null => {
    const field = labelledFields(filterableFields(entity, record))[0]?.item
    if (!field) return null

    return { field: filterPath(record, field), operator: filterOperators(field)[0], value: '' }
  }

  const addFilter = () => {
    const filter = firstFilterFor(records[0])
    if (!filter) return

    onChange([...filters, { id: crypto.randomUUID(), ...filter }])
  }

  const changeRecord = (id: string, current: TFilterRecord, recordKey: string) => {
    const record = recordKey === current.key ? undefined : recordsByKey.get(recordKey)
    const filter = record && firstFilterFor(record)
    if (!filter) return

    onChange(filters.map((item) => (item.id === id ? { id, ...filter } : item)))
  }

  const updateFilter = (id: string, updates: Partial<Omit<TReportFilter, 'id'>>) => {
    onChange(
      filters.map((filter) => {
        if (filter.id !== id) return filter

        const field = resolveFilterField(entity, filter.field)?.field
        const next = { ...filter, ...updates }
        const nextField = resolveFilterField(entity, next.field)?.field

        if (!field || !nextField) return next

        const operators = filterOperators(nextField)
        if (!operators.includes(next.operator)) next.operator = operators[0]

        if (next.field !== filter.field || filterValueInput(nextField, next.operator) !== filterValueInput(field, filter.operator)) next.value = ''

        return next
      }),
    )
  }

  return (
    <ReportPanel
      title="Filters"
      description={`Narrow down results (optional, up to ${MAX_FILTERS})`}
      action={
        filters.length > 1 ? (
          <Select value={combinator} onValueChange={(value) => onCombinatorChange(value as TReportCombinator)}>
            <SelectTrigger className="h-7 w-32 text-xs" aria-label="Combine filters">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">Match all</SelectItem>
              <SelectItem value="or">Match any</SelectItem>
            </SelectContent>
          </Select>
        ) : null
      }
    >
      <div className="flex flex-col gap-2">
        {filters.map((filter, index) => {
          const resolved = resolveFilterField(entity, filter.field)
          const record = resolved && recordsByPath.get(resolved.recordPath)
          if (!resolved || !record) return null

          return (
            <ReportFilterRow
              key={filter.id}
              entity={entity}
              filter={filter}
              field={resolved.field}
              record={record}
              recordOptions={recordOptions}
              onRecordChange={(recordKey) => changeRecord(filter.id, record, recordKey)}
              combinator={combinator}
              showCombinator={index > 0}
              onUpdate={(updates) => updateFilter(filter.id, updates)}
              onRemove={() => onChange(filters.filter((item) => item.id !== filter.id))}
            />
          )
        })}
      </div>

      <Button type="button" variant="outline" size="md" full className="mt-2" icon={<Plus size={14} />} iconPosition="left" onClick={addFilter} disabled={filters.length >= MAX_FILTERS}>
        Add filter
      </Button>
    </ReportPanel>
  )
}

export default memo(ReportFiltersPanel)
