'use client'

import React, { useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import type { TReportEdge } from '@repo/codegen/src/report-schema.generated'
import { buildPath, edgeChainPath, getEdgeFields, getRelatedEdges, labelledEdges, labelledSchemaFields, MAX_EDGE_DEPTH, pathLabel, pathSegments } from '@/lib/report/report-schema'
import ReportFieldList, { type TReportFieldOption } from './report-field-list'
import { pluralizeWithCount } from '@/utils/strings'
import { matchesSearch } from './report-search'

export type TEdgeGroup = {
  chain: TReportEdge[]
  label: string
}

const lastEdge = (group: TEdgeGroup): TReportEdge => group.chain[group.chain.length - 1]

const groupOptions = (group: TEdgeGroup): TReportFieldOption[] => {
  const prefix = edgeChainPath(group.chain)

  return labelledSchemaFields(getEdgeFields(lastEdge(group))).map(({ item, label }) => ({ path: buildPath(prefix, item.name), label }))
}

const nestedGroups = (group: TEdgeGroup): TEdgeGroup[] =>
  group.chain.length < MAX_EDGE_DEPTH ? labelledEdges(getRelatedEdges(lastEdge(group))).map(({ item, label }) => ({ chain: [...group.chain, item], label })) : []

const labelMatches = (group: TEdgeGroup, search: string): boolean => matchesSearch(lastEdge(group).name, group.label, search)

export const countSelectedByEdgePath = (selected: Set<string>): Map<string, number> => {
  const counts = new Map<string, number>()

  for (const path of selected) {
    const segments = pathSegments(path)

    for (let depth = 1; depth < segments.length; depth += 1) {
      const prefix = buildPath(...segments.slice(0, depth))
      counts.set(prefix, (counts.get(prefix) ?? 0) + 1)
    }
  }

  return counts
}

export const edgeGroupMatches = (group: TEdgeGroup, search: string, includeNested: boolean): boolean => {
  if (search.trim() === '' || labelMatches(group, search)) return true
  if (groupOptions(group).some((option) => matchesSearch(option.path, option.label, search))) return true

  return includeNested && nestedGroups(group).some((nested) => edgeGroupMatches(nested, search, false))
}

type TReportEdgeGroupProps = {
  group: TEdgeGroup
  search: string
  selected: Set<string>
  selectedCounts: Map<string, number>
  expanded: Set<string>
  onToggleExpanded: (path: string) => void
  onToggle: (path: string) => void
  onToggleMany: (paths: string[], selectAll: boolean) => void
}

const ReportEdgeGroup: React.FC<TReportEdgeGroupProps> = ({ group, search, selected, selectedCounts, expanded, onToggleExpanded, onToggle, onToggleMany }) => {
  const path = edgeChainPath(group.chain)
  const isSearching = search.trim() !== ''
  const isExpanded = expanded.has(path) || (isSearching && group.chain.length === 1)
  const showEverything = !isSearching || labelMatches(group, search)

  const options = useMemo(() => groupOptions(group), [group])
  const nested = useMemo(() => nestedGroups(group), [group])

  const visibleOptions = showEverything ? options : options.filter((option) => matchesSearch(option.path, option.label, search))
  const visibleNested = showEverything ? nested : nested.filter((child) => edgeGroupMatches(child, search, false))

  const selectedCount = options.filter((option) => selected.has(option.path)).length
  const selectedTotal = selectedCounts.get(path) ?? 0

  return (
    <div>
      <div className="flex items-center gap-2">
        <Checkbox
          aria-label={`Select all ${pathLabel(path)} fields`}
          checked={selectedCount === 0 ? false : selectedCount === options.length ? true : 'indeterminate'}
          onCheckedChange={() =>
            onToggleMany(
              options.map((option) => option.path),
              selectedCount !== options.length,
            )
          }
        />
        <Button
          type="button"
          variant="transparent"
          aria-expanded={isExpanded}
          onClick={() => onToggleExpanded(path)}
          className="h-auto min-w-0 flex-1 justify-start gap-1 border-0 px-0 py-0.5 text-sm font-normal"
        >
          {isExpanded ? <ChevronDown className="text-muted-foreground" /> : <ChevronRight className="text-muted-foreground" />}
          <span className="truncate">{group.label}</span>
          {selectedTotal > 0 && <span className="text-xs text-muted-foreground">({selectedTotal})</span>}
          {isSearching && !isExpanded && !showEverything && <span className="text-xs text-muted-foreground">· {pluralizeWithCount(visibleOptions.length, 'match', 'matches')}</span>}
        </Button>
      </div>
      {isExpanded && (
        <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-border pl-3">
          {visibleOptions.length > 0 && <ReportFieldList options={visibleOptions} selected={selected} onToggle={onToggle} className="flex flex-col gap-1" />}
          {visibleNested.length > 0 && (
            <div className="mt-1 flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Records linked to {group.label}</p>
              {visibleNested.map((child) => (
                <ReportEdgeGroup
                  key={edgeChainPath(child.chain)}
                  group={child}
                  search={search}
                  selected={selected}
                  selectedCounts={selectedCounts}
                  expanded={expanded}
                  onToggleExpanded={onToggleExpanded}
                  onToggle={onToggle}
                  onToggleMany={onToggleMany}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReportEdgeGroup
