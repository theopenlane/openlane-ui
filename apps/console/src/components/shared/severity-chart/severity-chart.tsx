'use client'

import React, { useEffect, useState } from 'react'
import { useVulnerabilitySeverityCounts } from '@/lib/graphql-hooks/vulnerability'
import { useFindingSeverityCounts } from '@/lib/graphql-hooks/finding'
import { cn } from '@repo/ui/lib/utils'
import { type TableKeyValue } from '@repo/ui/table-key'
import { getFiltersUpdatedEvent, saveFilters, loadFilters, type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { useOrganization } from '@/hooks/useOrganization'

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

const SEVERITY_LEVELS: SeverityLevel[] = ['critical', 'high', 'medium', 'low']

const SEVERITY_CONFIG: { level: SeverityLevel; label: string; color: string; bgColor: string }[] = [
  { level: 'critical', label: 'Critical', color: 'var(--color-severity-critical)', bgColor: 'color-mix(in srgb, var(--color-severity-critical) 20%, transparent)' },
  { level: 'high', label: 'High', color: 'var(--color-severity-high)', bgColor: 'color-mix(in srgb, var(--color-severity-high) 20%, transparent)' },
  { level: 'medium', label: 'Medium', color: 'var(--color-severity-medium)', bgColor: 'color-mix(in srgb, var(--color-severity-medium) 20%, transparent)' },
  { level: 'low', label: 'Low', color: '#22c55e', bgColor: 'color-mix(in srgb, #22c55e 20%, transparent)' },
]

type Props = {
  variant: 'vulnerability' | 'finding'
  tableKey: TableKeyValue
}

const LABELS: Record<Props['variant'], string> = {
  vulnerability: 'Open Vulnerabilities by Severity',
  finding: 'Open Findings by Severity',
}

const deriveSelectedSeverity = (filterState: TFilterState | null): SeverityLevel | null => {
  const raw = filterState?.securityLevelIn
  const values = Array.isArray(raw) ? raw : []
  if (values.length !== 1) return null
  const level = String(values[0]).toLowerCase()
  return SEVERITY_LEVELS.find((l) => l === level) ?? null
}

const SeverityChart: React.FC<Props> = ({ variant, tableKey }) => {
  const { currentOrgId } = useOrganization()
  const vulnCounts = useVulnerabilitySeverityCounts(variant === 'vulnerability')
  const findingCounts = useFindingSeverityCounts(variant === 'finding')
  const counts = variant === 'finding' ? findingCounts : vulnCounts
  const total = counts.critical + counts.high + counts.medium + counts.low

  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | null>(null)

  useEffect(() => {
    const sync = () => setSelectedSeverity(deriveSelectedSeverity(loadFilters(tableKey, undefined, currentOrgId)))
    sync()
    const eventName = getFiltersUpdatedEvent(tableKey, currentOrgId)
    window.addEventListener(eventName, sync)
    return () => window.removeEventListener(eventName, sync)
  }, [tableKey, currentOrgId])

  const applySeverity = (level: SeverityLevel | null) => {
    const { securityLevelIn: _omit, ...rest } = loadFilters(tableKey, undefined, currentOrgId) ?? {}
    const next: TFilterState = level ? { ...rest, open: true, securityLevelIn: [level.toUpperCase()] } : { ...rest }
    saveFilters(tableKey, next, currentOrgId)
  }

  const handleClick = (level: SeverityLevel) => {
    applySeverity(selectedSeverity === level ? null : level)
  }

  return (
    <div className="mb-4 rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground mb-3">{LABELS[variant]}</p>
      <div className="flex flex-col gap-2">
        {SEVERITY_CONFIG.map(({ level, label, color, bgColor }) => {
          const count = counts[level]
          const pct = total > 0 ? Math.max((count / total) * 100, count > 0 ? 2 : 0) : 0
          const isSelected = selectedSeverity === level
          const isFiltered = selectedSeverity !== null && !isSelected

          return (
            <button
              key={level}
              type="button"
              onClick={() => handleClick(level)}
              className={cn('group relative flex items-center gap-3 rounded-md px-3 py-2 text-left transition-all hover:bg-accent/50', isFiltered && 'opacity-40')}
              style={isSelected ? { outline: `1px solid ${color}` } : undefined}
            >
              <div className="absolute inset-0 rounded-md transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: bgColor }} />
              <span className="relative z-10 w-14 shrink-0 text-sm font-medium" style={{ color }}>
                {label}
              </span>
              <span className="relative z-10 ml-auto text-sm font-semibold tabular-nums">{counts.isLoading ? '—' : count.toLocaleString()}</span>
            </button>
          )
        })}
      </div>
      {selectedSeverity && (
        <button type="button" onClick={() => applySeverity(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Clear filter
        </button>
      )}
    </div>
  )
}

export const VulnerabilitySeverityChart: React.FC<Omit<Props, 'variant'>> = (props) => <SeverityChart variant="vulnerability" {...props} />

export const FindingSeverityChart: React.FC<Omit<Props, 'variant'>> = (props) => <SeverityChart variant="finding" {...props} />

export default VulnerabilitySeverityChart
