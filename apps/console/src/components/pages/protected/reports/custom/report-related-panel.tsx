'use client'

import React, { memo, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import { RELATED_RECORD_LIMIT } from '@/lib/report/build-report-query'
import { buildPath, getEdgeFields, labelledEdges, labelledFields } from '@/lib/report/report-schema'
import ReportPanel from './report-panel'
import ReportFieldList, { type TReportFieldOption } from './report-field-list'
import { matchesSearch } from './report-search'

type TReportRelatedPanelProps = {
  entity: TReportEntity
  selected: Set<string>
  onToggle: (path: string) => void
  onToggleMany: (paths: string[], selectAll: boolean) => void
}

type TEdgeGroup = {
  name: string
  label: string
  options: TReportFieldOption[]
}

const ReportRelatedPanel: React.FC<TReportRelatedPanelProps> = ({ entity, selected, onToggle, onToggleMany }) => {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])

  const groups = useMemo<TEdgeGroup[]>(
    () =>
      labelledEdges(entity)
        .map(({ item: edge, label }) => ({
          name: edge.name,
          label,
          options: labelledFields(getEdgeFields(edge)).map(({ item: field, label: fieldLabel }) => ({ path: buildPath(edge.name, field.name), label: fieldLabel })),
        }))
        .filter((group) => group.options.length > 0),
    [entity],
  )

  const visible = useMemo(
    () =>
      groups
        .map((group) => (matchesSearch(group.name, group.label, search) ? group : { ...group, options: group.options.filter((option) => matchesSearch(option.path, option.label, search)) }))
        .filter((group) => group.options.length > 0),
    [groups, search],
  )

  const isSearching = search.trim().length > 0

  const toggleExpanded = (edgeName: string) => setExpanded((current) => (current.includes(edgeName) ? current.filter((name) => name !== edgeName) : [...current, edgeName]))

  if (groups.length === 0) return null

  return (
    <ReportPanel title="Related data" description={`Include fields from linked records, up to the first ${RELATED_RECORD_LIMIT} per record`}>
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search related fields" className="mb-2" />
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-xs text-muted-foreground">No matching fields</p>
        ) : (
          visible.map((group) => {
            const selectedCount = group.options.filter((option) => selected.has(option.path)).length
            const isExpanded = isSearching || expanded.includes(group.name)

            return (
              <div key={group.name}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label={`Select all ${group.label} fields`}
                    checked={selectedCount === 0 ? false : selectedCount === group.options.length ? true : 'indeterminate'}
                    onCheckedChange={() =>
                      onToggleMany(
                        group.options.map((option) => option.path),
                        selectedCount !== group.options.length,
                      )
                    }
                  />
                  <button type="button" onClick={() => toggleExpanded(group.name)} className="flex items-center gap-1 text-sm flex-1 text-left">
                    {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                    <span className="truncate">{group.label}</span>
                    {selectedCount > 0 && <span className="text-xs text-muted-foreground">({selectedCount})</span>}
                  </button>
                </div>
                {isExpanded && <ReportFieldList options={group.options} selected={selected} onToggle={onToggle} className="ml-6 flex flex-col gap-1 mt-1 border-l border-border pl-3" />}
              </div>
            )
          })
        )}
      </div>
    </ReportPanel>
  )
}

export default memo(ReportRelatedPanel)
