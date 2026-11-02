'use client'

import React from 'react'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Switch } from '@repo/ui/switch'
import { getSeverityStyle } from '@/utils/severity'
import PastDueBadge from '@/components/shared/past-due-badge/past-due-badge'
import { type TriageFacet, type TriageRailRow, type TriageRailSection } from './triage-utils'

type Props = {
  sections: TriageRailSection[]
  counts: { all: number; pastDue: number; critical: number }
  search: string
  onSearchChange: (value: string) => void
  facet: TriageFacet
  onFacetChange: (facet: TriageFacet) => void
  groupByCve: boolean
  onGroupByCveChange: (grouped: boolean) => void
  notice?: string
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

const RailRow: React.FC<{ row: TriageRailRow; isSelected: boolean; onSelect: (id: string) => void }> = ({ row, isSelected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(row.id)}
    className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors ${isSelected ? 'border-brand bg-muted' : 'border-transparent hover:bg-muted/60'}`}
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold" style={getSeverityStyle(row.severityLabel)}>
      {typeof row.score === 'number' ? row.score.toFixed(1) : '—'}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">{row.title}</span>
      <span className="block truncate text-xs text-muted-foreground">{row.subline}</span>
    </span>
    <PastDueBadge show={row.pastDue} />
  </button>
)

const Section: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => (
  <div>
    <div className="sticky top-0 z-10 bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {title} · {count}
    </div>
    {children}
  </div>
)

const TriageListRail: React.FC<Props> = ({
  sections,
  counts,
  search,
  onSearchChange,
  facet,
  onFacetChange,
  groupByCve,
  onGroupByCveChange,
  notice,
  selectedId,
  onSelect,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
}) => {
  const totalShown = sections.reduce((total, section) => total + section.rows.length, 0)

  const chips: { key: TriageFacet; label: string }[] = [
    { key: 'all', label: `All ${counts.all}` },
    { key: 'pastdue', label: `Past due ${counts.pastDue}` },
    { key: 'critical', label: `Critical ${counts.critical}` },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-secondary">
      <div className="shrink-0 space-y-3 border-b p-3">
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search vulnerabilities…" className="pl-8" />
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFacetChange(chip.key)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                facet === chip.key ? 'border-brand bg-brand/10 text-brand' : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Switch id="triage-group-by-cve" checked={groupByCve} onCheckedChange={onGroupByCveChange} />
          <Label htmlFor="triage-group-by-cve" className="text-sm">
            Group by CVE
          </Label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {notice && <p className="px-3 py-2 text-xs text-muted-foreground">{notice}</p>}
            {totalShown === 0 && <p className="p-4 text-sm text-muted-foreground">No vulnerabilities match.</p>}

            {sections.map(
              (section) =>
                section.rows.length > 0 && (
                  <Section key={section.key} title={section.title} count={section.rows.length}>
                    {section.rows.map((row) => (
                      <RailRow key={row.id} row={row} isSelected={row.id === selectedId} onSelect={onSelect} />
                    ))}
                  </Section>
                ),
            )}

            {hasMore && (
              <div className="p-3">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  {isLoadingMore && <Loader2 size={14} className="animate-spin" />}
                  {isLoadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TriageListRail
