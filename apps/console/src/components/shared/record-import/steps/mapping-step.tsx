'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { cn } from '@repo/ui/lib/utils'
import { type Option } from '@repo/ui/multiple-selector'
import { Callout } from '@/components/shared/callout/callout'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { pluralizeWithCount } from '@/utils/strings'
import type { TColumnMapping, TDestinationField, TMatchConfidence, TSourceColumn } from '../lib/types'
import type { TMappingValidation } from '../lib/validate-mapping'

const MATCH_LABELS: Record<TMatchConfidence, string> = {
  exact: 'Exact',
  normalized: 'Normalized',
  alias: 'Alias',
  pattern: 'Pattern',
  manual: 'Manual',
  none: 'No match',
}

const MAPPING_ROW_GRID = 'grid grid-cols-[minmax(160px,1fr)_minmax(180px,1.4fr)_minmax(220px,1fr)_110px] items-center gap-4'
const EXAMPLE_VALUES_SHOWN = 2

const COLUMN_FILTERS = ['all', 'mapped', 'unmapped', 'issues'] as const
type TColumnFilter = (typeof COLUMN_FILTERS)[number]

type TMappingStepProps = {
  entityLabel: string
  columns: TSourceColumn[]
  fields: TDestinationField[]
  mapping: Record<number, TColumnMapping>
  validation: TMappingValidation
  rowCount: number
  onColumnFieldChange: (index: number, field: string | null) => void
}

export const MappingStep: React.FC<TMappingStepProps> = ({ entityLabel, columns, fields, mapping, validation, rowCount, onColumnFieldChange }) => {
  const [filter, setFilter] = useState<TColumnFilter>('all')
  const [search, setSearch] = useState('')
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)

  const options = useMemo<Option[]>(() => fields.map((field) => ({ value: field.name, label: field.required ? `${field.label} (required)` : field.label })), [fields])

  const counts: Record<TColumnFilter, number> = {
    all: columns.length,
    mapped: validation.mappedColumnCount,
    unmapped: validation.ignoredColumnCount,
    issues: validation.columnsWithIssues.size,
  }

  const visibleColumns = useMemo(() => {
    const term = search.trim().toLowerCase()
    return columns.filter((column) => {
      if (term && !column.header.toLowerCase().includes(term)) return false
      if (filter === 'mapped') return Boolean(mapping[column.index]?.field)
      if (filter === 'unmapped') return !mapping[column.index]?.field
      if (filter === 'issues') return validation.columnsWithIssues.has(column.index)

      return true
    })
  }, [columns, mapping, filter, search, validation])

  useEffect(() => {
    if (highlightedColumn === null) return
    document.getElementById(`import-column-${highlightedColumn}`)?.scrollIntoView({ block: 'center' })
  }, [highlightedColumn])

  const focusIssue = (columnIndex?: number) => {
    if (columnIndex === undefined) return
    setFilter('all')
    setSearch('')
    setHighlightedColumn(columnIndex)
  }

  const changeColumnField = (index: number, field: string | null) => {
    setHighlightedColumn((current) => (current === index ? null : current))
    onColumnFieldChange(index, field)
  }

  return (
    <div className="flex flex-col gap-4">
      {validation.blockingIssues.length > 0 ? (
        <Callout variant="danger" title={`${pluralizeWithCount(validation.blockingIssues.length, 'issue')} ${validation.blockingIssues.length === 1 ? 'blocks' : 'block'} this import`}>
          <ul className="flex flex-col gap-1">
            {validation.blockingIssues.map((issue) => (
              <li key={issue.id} className="flex items-center gap-2">
                <span>• {issue.message}</span>
                {issue.columnIndex !== undefined && (
                  <Button variant="transparent" size="sm" className="h-auto px-0 text-blue-500 hover:underline" onClick={() => focusIssue(issue.columnIndex)}>
                    Fix
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Callout>
      ) : (
        <Callout variant="success" compact>
          All required fields are mapped. {validation.mappedColumnCount} of {pluralizeWithCount(columns.length, 'column')} will be imported.
        </Callout>
      )}

      <div className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          {COLUMN_FILTERS.map((value) => (
            <Button key={value} variant="tag" size="sm" className={cn(filter === value && 'is-active')} onClick={() => setFilter(value)}>
              {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)} · {counts[value]}
            </Button>
          ))}
          <div className="ml-auto">
            <Input
              className="w-[220px] bg-transparent"
              icon={<SearchIcon size={16} />}
              iconPosition="left"
              variant="searchTable"
              placeholder="Search columns"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </div>
        </div>

        <div className={cn(MAPPING_ROW_GRID, 'border-b px-4 py-2 text-xs uppercase text-muted-foreground')}>
          <span>Column in your file</span>
          <span>Example values</span>
          <span>Import as</span>
          <span>Match</span>
        </div>

        {visibleColumns.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No columns match this view.</p>
        ) : (
          <ul>
            {visibleColumns.map((column) => {
              const columnMapping = mapping[column.index]
              const hasIssue = validation.columnsWithIssues.has(column.index)

              return (
                <li
                  key={column.index}
                  id={`import-column-${column.index}`}
                  className={cn(MAPPING_ROW_GRID, 'border-b px-4 py-3 last:border-b-0', hasIssue && 'bg-[var(--color-danger)]/5', highlightedColumn === column.index && 'ring-1 ring-primary')}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm" title={column.header}>
                      {column.header}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {column.filledCount} of {rowCount} filled
                    </p>
                  </div>
                  <div className="min-w-0 text-sm text-muted-foreground">
                    {column.values.slice(0, EXAMPLE_VALUES_SHOWN).map((value, valueIndex) => (
                      <p key={valueIndex} className="truncate" title={value}>
                        {value}
                      </p>
                    ))}
                    {column.values.length === 0 && <p className="italic">No values</p>}
                  </div>
                  <SearchableSingleSelect
                    value={columnMapping?.field ?? ''}
                    options={options}
                    placeholder="Ignore this column"
                    clearable
                    clearLabel="Ignore this column"
                    ariaLabel={`Import "${column.header}" as a ${entityLabel} field`}
                    onChange={(value) => changeColumnField(column.index, value || null)}
                  />
                  <Badge variant={hasIssue ? 'destructive' : columnMapping?.field ? 'green' : 'outline'} className="w-fit">
                    {hasIssue ? 'Duplicate' : MATCH_LABELS[columnMapping?.confidence ?? 'none']}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
