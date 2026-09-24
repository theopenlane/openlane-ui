'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Info, ListChecks, SearchIcon } from 'lucide-react'
import { Badge, type BadgeProps } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { cn } from '@repo/ui/lib/utils'
import { type Option } from '@repo/ui/multiple-selector'
import { Callout } from '@/components/shared/callout/callout'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { pluralizeWithCount } from '@/utils/strings'
import { isEmptyColumn } from '../lib/match-columns'
import type { TColumnMapping, TDestinationField, TMatchConfidence, TSourceColumn } from '../lib/types'
import type { TMappingValidation } from '../lib/validate-mapping'
import type { TColumnCellCheck } from '../lib/validate-cells'
import { ValueMappingPanel } from './value-mapping-panel'

const MATCH_LABELS: Record<Exclude<TMatchConfidence, 'none'>, string> = {
  exact: 'Exact',
  normalized: 'Normalized',
  alias: 'Alias',
  suggested: 'Suggested',
  pattern: 'Pattern',
  manual: 'Manual',
}

const MAPPING_ROW_GRID = 'grid grid-cols-[minmax(160px,1fr)_minmax(180px,1.4fr)_minmax(260px,1.2fr)_110px] items-center gap-4'
const EXAMPLE_VALUES_SHOWN = 2

const COLUMN_FILTERS = ['all', 'mapped', 'unmapped', 'issues'] as const
type TColumnFilter = (typeof COLUMN_FILTERS)[number]

type TMatchBadge = { label: string; variant: BadgeProps['variant'] }

const matchBadge = (column: TSourceColumn, columnMapping: TColumnMapping | undefined, isDuplicate: boolean, unresolvedValueCount: number): TMatchBadge => {
  if (isEmptyColumn(column)) return { label: 'Empty', variant: 'outline' }
  if (isDuplicate) return { label: 'Duplicate', variant: 'destructive' }
  if (!columnMapping?.field) return { label: columnMapping?.confidence === 'manual' ? 'Ignored' : 'No match', variant: 'outline' }
  if (columnMapping.confidence === 'none') return { label: 'No match', variant: 'outline' }
  const remapped = Object.keys(columnMapping.valueMap ?? {}).length
  if (remapped > 0 && unresolvedValueCount === 0) return { label: `Values mapped (${remapped})`, variant: 'green' }
  return { label: MATCH_LABELS[columnMapping.confidence], variant: columnMapping.confidence === 'suggested' ? 'blue' : 'green' }
}

const fieldOptionLabel = (field: TDestinationField): string => {
  if (field.requirement === 'required') return `${field.label} (required)`
  if (field.requirement === 'oneOf') return `${field.label} (one of)`
  return field.label
}

type TMappingStepProps = {
  entityLabel: string
  entityLabelPlural: string
  columns: TSourceColumn[]
  fields: TDestinationField[]
  hasRequirements: boolean
  mapping: Record<number, TColumnMapping>
  validation: TMappingValidation
  cellChecks: ReadonlyMap<number, TColumnCellCheck>
  rowCount: number
  onColumnFieldChange: (index: number, field: string | null) => void
  onColumnValueChange: (index: number, value: string, target: string | null) => void
}

export const MappingStep: React.FC<TMappingStepProps> = ({
  entityLabel,
  entityLabelPlural,
  columns,
  fields,
  hasRequirements,
  mapping,
  validation,
  cellChecks,
  rowCount,
  onColumnFieldChange,
  onColumnValueChange,
}) => {
  const [filter, setFilter] = useState<TColumnFilter>('all')
  const [expandedValueColumns, setExpandedValueColumns] = useState<ReadonlySet<number>>(() => new Set())
  const [search, setSearch] = useState('')
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)

  const options = useMemo<Option[]>(() => fields.map((field) => ({ value: field.name, label: fieldOptionLabel(field), description: field.description })), [fields])
  const fieldByName = useMemo(() => new Map(fields.map((field) => [field.name, field])), [fields])

  const counts: Record<TColumnFilter, number> = {
    all: columns.length,
    mapped: validation.mappedColumnCount,
    unmapped: validation.ignoredColumnCount,
    issues: validation.columnsWithIssues.size,
  }

  const visibleColumns = useMemo(() => {
    const term = search.trim().toLowerCase()
    const matching = columns.filter((column) => {
      if (term && !column.header.toLowerCase().includes(term)) return false
      if (filter === 'mapped') return Boolean(mapping[column.index]?.field)
      if (filter === 'unmapped') return !mapping[column.index]?.field
      if (filter === 'issues') return validation.columnsWithIssues.has(column.index)

      return true
    })

    return matching.sort((a, b) => Number(isEmptyColumn(a)) - Number(isEmptyColumn(b)))
  }, [columns, mapping, filter, search, validation])

  useEffect(() => {
    if (highlightedColumn === null) return
    document.getElementById(`import-column-${highlightedColumn}`)?.scrollIntoView({ block: 'center' })
  }, [highlightedColumn])

  const toggleValueMapping = (columnIndex: number) =>
    setExpandedValueColumns((current) => {
      const next = new Set(current)
      if (!next.delete(columnIndex)) next.add(columnIndex)
      return next
    })

  const openValueMapping = (columnIndex: number) => setExpandedValueColumns((current) => new Set(current).add(columnIndex))

  const focusIssue = (columnIndex?: number) => {
    if (columnIndex === undefined) return
    if (cellChecks.get(columnIndex)?.mappableValues) openValueMapping(columnIndex)
    setFilter('all')
    setSearch('')
    setHighlightedColumn(columnIndex)
  }

  const changeColumnField = (index: number, field: string | null) => {
    setHighlightedColumn((current) => (current === index ? null : current))
    onColumnFieldChange(index, field)
  }

  const importedSummary = `${validation.mappedColumnCount} of ${pluralizeWithCount(columns.length, 'column')} will be imported.`

  return (
    <div className="flex flex-col gap-4">
      {validation.blockingIssues.length > 0 ? (
        <Callout variant="danger" title={`${pluralizeWithCount(validation.blockingIssues.length, 'issue')} ${validation.blockingIssues.length === 1 ? 'blocks' : 'block'} this import`}>
          <ul className="flex flex-col gap-1">
            {validation.blockingIssues.map((issue) => (
              <li key={issue.id} className="flex items-center gap-2">
                <span>• {issue.message}</span>
                {issue.columnIndex !== undefined && (
                  <Button variant="link" className="text-blue-500" onClick={() => focusIssue(issue.columnIndex)}>
                    Fix
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Callout>
      ) : (
        <Callout variant="success" compact>
          {hasRequirements ? `All required fields are mapped. ${importedSummary}` : `${entityLabelPlural} have no required fields. ${importedSummary}`}
        </Callout>
      )}

      <div className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          {COLUMN_FILTERS.map((value) => (
            <Button key={value} variant="tag" className={cn(filter === value && 'is-active')} onClick={() => setFilter(value)}>
              {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)} · {counts[value]}
            </Button>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <Input
              className="w-full bg-transparent sm:w-[220px]"
              icon={<SearchIcon size={16} />}
              iconPosition="left"
              variant="searchTable"
              placeholder="Search columns"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
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
                  const isEmpty = isEmptyColumn(column)
                  const badge = matchBadge(column, columnMapping, validation.duplicateColumns.has(column.index), validation.unresolvedValueCounts.get(column.index) ?? 0)
                  const selectedField = columnMapping?.field ? fieldByName.get(columnMapping.field) : undefined
                  const cellCheck = cellChecks.get(column.index)
                  const canMapValues = Boolean(cellCheck?.mappableValues)
                  const unmappedValueCount = validation.unresolvedValueCounts.get(column.index) ?? 0
                  const isValueMappingOpen = canMapValues && expandedValueColumns.has(column.index)
                  const valuePanelId = `import-column-values-${column.index}`

                  return (
                    <li
                      key={column.index}
                      id={`import-column-${column.index}`}
                      className={cn(
                        MAPPING_ROW_GRID,
                        'border-b px-4 py-3 last:border-b-0',
                        hasIssue && 'bg-[var(--color-danger)]/5',
                        isEmpty && 'opacity-60',
                        highlightedColumn === column.index && 'ring-1 ring-primary',
                      )}
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
                        {isEmpty && <p className="italic">No values</p>}
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <SearchableSingleSelect
                          className="min-w-0 flex-1"
                          value={columnMapping?.field ?? ''}
                          options={options}
                          placeholder={isEmpty ? 'Nothing to import' : 'Ignore this column'}
                          clearable
                          clearLabel="Ignore this column"
                          disabled={isEmpty}
                          ariaLabel={`Import "${column.header}" as a ${entityLabel} field`}
                          onChange={(value) => changeColumnField(column.index, value || null)}
                        />
                        {canMapValues && (
                          <Button
                            variant="icon"
                            size="icon-sm"
                            className={cn('shrink-0', unmappedValueCount > 0 ? 'text-destructive' : 'text-muted-foreground')}
                            descriptiveTooltipText={unmappedValueCount > 0 ? `Map ${pluralizeWithCount(unmappedValueCount, 'value')}` : 'Map values'}
                            aria-expanded={isValueMappingOpen}
                            aria-controls={isValueMappingOpen ? valuePanelId : undefined}
                            onClick={() => toggleValueMapping(column.index)}
                          >
                            <ListChecks size={16} />
                          </Button>
                        )}
                        {selectedField?.description && (
                          <Button variant="icon" size="icon-sm" className="shrink-0 text-muted-foreground" descriptiveTooltipText={selectedField.description}>
                            <Info size={16} />
                          </Button>
                        )}
                      </div>
                      <Badge variant={badge.variant} className="w-fit">
                        {badge.label}
                      </Badge>
                      {isValueMappingOpen && selectedField && cellCheck && (
                        <ValueMappingPanel
                          id={valuePanelId}
                          fieldLabel={selectedField.label}
                          check={cellCheck}
                          valueMap={columnMapping?.valueMap}
                          onValueChange={(value, target) => onColumnValueChange(column.index, value, target)}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
