'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import Skeleton from '@/components/shared/skeleton/skeleton'

type SeverityCounts = { critical: number; high: number; medium: number; low: number }

type Props = {
  severityData: {
    vulns: SeverityCounts
    findings: SeverityCounts
    risks: SeverityCounts
  }
  isLoading?: boolean
}

const SEV_COLORS = {
  critical: { bg: 'bg-destructive', text: 'text-destructive', dot: '#EF4444' },
  high: { bg: 'bg-orange-500', text: 'text-orange-500', dot: '#F97316' },
  medium: { bg: 'bg-yellow-500', text: 'text-yellow-500', dot: '#EAB308' },
  low: { bg: 'bg-blue-400', text: 'text-blue-400', dot: '#60A5FA' },
}

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
const TYPES = [
  { key: 'vulns', label: 'Vulnerabilities' },
  { key: 'findings', label: 'Findings' },
  { key: 'risks', label: 'Risks' },
] as const

const SeverityRow = ({ label, counts }: { label: string; counts: SeverityCounts }) => {
  const total = counts.critical + counts.high + counts.medium + counts.low || 1

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">
          {total === 1 && counts.critical + counts.high + counts.medium + counts.low === 0 ? '0 items' : `${counts.critical + counts.high + counts.medium + counts.low} items`}
        </span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {SEVERITIES.map((sev) => {
          const pct = (counts[sev] / total) * 100
          if (pct === 0) return null
          return <div key={sev} className={`${SEV_COLORS[sev].bg} h-full`} style={{ width: `${pct}%` }} title={`${sev}: ${counts[sev]}`} />
        })}
      </div>
      <div className="flex gap-3">
        {SEVERITIES.map((sev) => (
          <div key={sev} className="flex items-center gap-1 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${SEV_COLORS[sev].bg}`} />
            <span className="capitalize text-muted-foreground">{sev}</span>
            <span className={`font-medium ${SEV_COLORS[sev].text}`}>{counts[sev]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ExposureSeverityChart = ({ severityData, isLoading }: Props) => {
  const totals = {
    critical: severityData.vulns.critical + severityData.findings.critical + severityData.risks.critical,
    high: severityData.vulns.high + severityData.findings.high + severityData.risks.high,
    medium: severityData.vulns.medium + severityData.findings.medium + severityData.risks.medium,
    low: severityData.vulns.low + severityData.findings.low + severityData.risks.low,
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xl font-medium leading-7">Exposure Posture</p>
          <div className="flex gap-3">
            {SEVERITIES.map((sev) => (
              <div key={sev} className="flex items-center gap-1 text-xs">
                <span className={`inline-block w-2 h-2 rounded-full ${SEV_COLORS[sev].bg}`} />
                <span className="capitalize">{sev}</span>
                <span className={`font-semibold ${SEV_COLORS[sev].text}`}>{totals[sev]}</span>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton width={128} height={16} />
                <Skeleton height={12} className="w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {TYPES.map(({ key, label }) => (
              <SeverityRow key={key} label={label} counts={severityData[key]} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ExposureSeverityChart
