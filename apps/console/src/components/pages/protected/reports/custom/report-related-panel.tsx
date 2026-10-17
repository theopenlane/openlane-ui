'use client'

import React, { memo, useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Input } from '@repo/ui/input'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import { RELATED_RECORD_LIMIT } from '@/lib/report/build-report-query'
import { edgeChainPath, labelledEdges } from '@/lib/report/report-schema'
import ReportPanel from './report-panel'
import ReportEdgeGroup, { countSelectedByEdgePath, edgeGroupMatches, type TEdgeGroup } from './report-edge-group'

type TReportRelatedPanelProps = {
  entity: TReportEntity
  selected: Set<string>
  onToggle: (path: string) => void
  onToggleMany: (paths: string[], selectAll: boolean) => void
}

const ReportRelatedPanel: React.FC<TReportRelatedPanelProps> = ({ entity, selected, onToggle, onToggleMany }) => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const groups = useMemo<TEdgeGroup[]>(() => labelledEdges(entity.edges).map(({ item: edge, label }) => ({ chain: [edge], label })), [entity])

  const matching = useMemo(() => groups.filter((group) => edgeGroupMatches(group, debouncedSearch, true)), [groups, debouncedSearch])
  const selectedCounts = useMemo(() => countSelectedByEdgePath(selected), [selected])
  const ordered = useMemo(() => [...matching].sort((a, b) => Number(selectedCounts.has(edgeChainPath(b.chain))) - Number(selectedCounts.has(edgeChainPath(a.chain)))), [matching, selectedCounts])

  const toggleExpanded = (path: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(path)) next.add(path)

      return next
    })

  if (groups.length === 0) return null

  return (
    <ReportPanel title="Related data" description={`Include fields from linked records and the records linked to them, up to the first ${RELATED_RECORD_LIMIT} per record`}>
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search related fields" className="mb-2" />
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {ordered.length === 0 ? (
          <p className="text-xs text-muted-foreground">No matching fields</p>
        ) : (
          ordered.map((group) => (
            <ReportEdgeGroup
              key={edgeChainPath(group.chain)}
              group={group}
              search={debouncedSearch}
              selected={selected}
              selectedCounts={selectedCounts}
              expanded={expanded}
              onToggleExpanded={toggleExpanded}
              onToggle={onToggle}
              onToggleMany={onToggleMany}
            />
          ))
        )}
      </div>
    </ReportPanel>
  )
}

export default memo(ReportRelatedPanel)
