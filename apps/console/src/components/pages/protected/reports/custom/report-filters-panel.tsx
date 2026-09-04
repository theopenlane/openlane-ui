'use client'

import React, { memo, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import { filterableFields, getFieldOperators, labelledFields } from '@/lib/report/report-schema'
import { filterValueInput, MAX_FILTERS, type TReportCombinator, type TReportFilter } from '@/lib/report/report-filters'
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
  const options = useMemo(() => labelledFields(filterableFields(entity)), [entity])
  const fieldsByName = useMemo(() => new Map(options.map(({ item }) => [item.name, item])), [options])

  const addFilter = () => {
    const field = options[0]?.item
    if (!field) return

    onChange([...filters, { id: crypto.randomUUID(), field: field.name, operator: getFieldOperators(field)[0], value: '' }])
  }

  const updateFilter = (id: string, updates: Partial<Omit<TReportFilter, 'id'>>) => {
    onChange(
      filters.map((filter) => {
        if (filter.id !== id) return filter

        const field = fieldsByName.get(filter.field)
        const next = { ...filter, ...updates }
        const nextField = fieldsByName.get(next.field)

        if (!field || !nextField) return next

        const operators = getFieldOperators(nextField)
        if (!operators.includes(next.operator)) next.operator = operators[0]

        if (filterValueInput(nextField, next.operator) !== filterValueInput(field, filter.operator)) next.value = ''

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
          const field = fieldsByName.get(filter.field)
          if (!field) return null

          return (
            <ReportFilterRow
              key={filter.id}
              filter={filter}
              field={field}
              options={options}
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
