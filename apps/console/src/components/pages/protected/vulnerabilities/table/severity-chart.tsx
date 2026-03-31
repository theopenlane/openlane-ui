'use client'

import React from 'react'
import { useVulnerabilitySeverityCounts } from '@/lib/graphql-hooks/vulnerability'
import { cn } from '@repo/ui/lib/utils'

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

const SEVERITY_CONFIG: { level: SeverityLevel; label: string; color: string; bgColor: string }[] = [
  { level: 'critical', label: 'Critical', color: 'var(--color-severity-critical)', bgColor: 'color-mix(in srgb, var(--color-severity-critical) 20%, transparent)' },
  { level: 'high', label: 'High', color: 'var(--color-severity-high)', bgColor: 'color-mix(in srgb, var(--color-severity-high) 20%, transparent)' },
  { level: 'medium', label: 'Medium', color: 'var(--color-severity-medium)', bgColor: 'color-mix(in srgb, var(--color-severity-medium) 20%, transparent)' },
  { level: 'low', label: 'Low', color: '#22c55e', bgColor: 'color-mix(in srgb, #22c55e 20%, transparent)' },
]

type Props = {
  selectedSeverity: SeverityLevel | null
  onSeveritySelect: (severity: SeverityLevel | null) => void
}

const VulnerabilitySeverityChart: React.FC<Props> = ({ selectedSeverity, onSeveritySelect }) => {
  const counts = useVulnerabilitySeverityCounts()
  const total = counts.critical + counts.high + counts.medium + counts.low

  const handleClick = (level: SeverityLevel) => {
    onSeveritySelect(selectedSeverity === level ? null : level)
  }

  return (
    <div className="mb-4 rounded-lg border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground mb-3">Vulnerabilities by Severity</p>
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
        <button type="button" onClick={() => onSeveritySelect(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Clear filter
        </button>
      )}
    </div>
  )
}

export default VulnerabilitySeverityChart
