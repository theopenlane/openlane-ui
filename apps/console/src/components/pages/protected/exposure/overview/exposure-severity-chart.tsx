'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

type SeverityCounts = { critical: number; high: number; medium: number; low: number }
type SeverityItems = { critical: string[]; high: string[]; medium: string[]; low: string[] }

type Props = {
  severityData: {
    vulns: SeverityCounts
    findings: SeverityCounts
    risks: SeverityCounts
  }
  severityItems?: {
    vulns: SeverityItems
    findings: SeverityItems
    risks: SeverityItems
  }
  isLoading?: boolean
}

const SEV_COLORS = {
  critical: { bg: 'bg-destructive', text: 'text-destructive' },
  high: { bg: 'bg-orange-500', text: 'text-orange-500' },
  medium: { bg: 'bg-yellow-500', text: 'text-yellow-500' },
  low: { bg: 'bg-blue-400', text: 'text-blue-400' },
}

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
const TYPES = [
  { key: 'vulns', label: 'Vulnerabilities' },
  { key: 'findings', label: 'Findings' },
  { key: 'risks', label: 'Risks' },
] as const

const SeverityRow = ({ label, counts }: { label: string; counts: SeverityCounts }) => {
  const total = counts.critical + counts.high + counts.medium + counts.low || 1
  const totalCount = counts.critical + counts.high + counts.medium + counts.low

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{totalCount === 0 ? '0 items' : `${totalCount} items`}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {SEVERITIES.map((sev) => {
          const pct = (counts[sev] / total) * 100
          if (pct === 0) return null
          return <div key={sev} className={`${SEV_COLORS[sev].bg} h-full`} style={{ width: `${pct}%` }} />
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

const ExposureSeverityChart = ({ severityData, severityItems, isLoading }: Props) => {
  const totals = {
    critical: severityData.vulns.critical + severityData.findings.critical + severityData.risks.critical,
    high: severityData.vulns.high + severityData.findings.high + severityData.risks.high,
    medium: severityData.vulns.medium + severityData.findings.medium + severityData.risks.medium,
    low: severityData.vulns.low + severityData.findings.low + severityData.risks.low,
  }

  const allItems: SeverityItems = {
    critical: [...(severityItems?.vulns.critical ?? []), ...(severityItems?.findings.critical ?? []), ...(severityItems?.risks.critical ?? [])],
    high: [...(severityItems?.vulns.high ?? []), ...(severityItems?.findings.high ?? []), ...(severityItems?.risks.high ?? [])],
    medium: [...(severityItems?.vulns.medium ?? []), ...(severityItems?.findings.medium ?? []), ...(severityItems?.risks.medium ?? [])],
    low: [...(severityItems?.vulns.low ?? []), ...(severityItems?.findings.low ?? []), ...(severityItems?.risks.low ?? [])],
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xl font-medium leading-7">Exposure Posture</p>
          <TooltipProvider disableHoverableContent delayDuration={200}>
            <div className="flex gap-3">
              {SEVERITIES.map((sev) => (
                <Tooltip key={sev}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs cursor-default">
                      <span className={`inline-block w-2 h-2 rounded-full ${SEV_COLORS[sev].bg}`} />
                      <span className="capitalize">{sev}</span>
                      <span className={`font-semibold ${SEV_COLORS[sev].text}`}>{totals[sev]}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-64">
                    <p className="font-semibold capitalize mb-1">{sev}</p>
                    {allItems[sev].length > 0 ? (
                      <ul className="space-y-0.5">
                        {allItems[sev].map((name) => (
                          <li key={name} className="text-xs">
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs">No items</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
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
