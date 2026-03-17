'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { saveFilters, type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { useRouter } from 'next/navigation'
import { TableKeyEnum, type TableKeyValue } from '@repo/ui/table-key'

type SeverityCounts = { href: string; tableKey: TableKeyValue; critical: number; high: number; medium: number; low: number }
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

const sevColor = (sev: string) => `var(--color-severity-${sev})`

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
const TYPES = [
  { key: 'vulns', label: 'Vulnerabilities' },
  { key: 'findings', label: 'Findings' },
  { key: 'risks', label: 'Risks' },
] as const

const SeverityRow = ({
  label,
  counts,
  severityData,
  items,
}: {
  label: string
  severityData: { href: string; tableKey: TableKeyValue; critical: number; high: number; medium: number; low: number }
  counts: SeverityCounts
  items?: SeverityItems
}) => {
  const router = useRouter()
  const total = counts.critical + counts.high + counts.medium + counts.low || 1
  const totalCount = counts.critical + counts.high + counts.medium + counts.low
  const navigateToFiltered = (sev: string) => {
    let filter: TFilterState
    if (severityData.tableKey === TableKeyEnum.RISK) {
      const impactMap: Record<string, string> = { critical: 'CRITICAL', high: 'HIGH', medium: 'MODERATE', low: 'LOW' }
      filter = { impactIn: [impactMap[sev] ?? sev.toUpperCase()] }
    } else {
      filter = { severityContainsFold: sev }
    }
    saveFilters(severityData.tableKey, filter)
    router.push(severityData.href)
  }
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{totalCount === 0 ? '0 items' : `${totalCount} items`}</span>
      </div>
      <TooltipProvider disableHoverableContent={false} delayDuration={200}>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {SEVERITIES.map((sev) => {
            const pct = (counts[sev] / total) * 100
            if (pct === 0) return null
            const sevItems = items?.[sev] ?? []
            const preview = sevItems.slice(0, 5)
            const hasMore = sevItems.length > 5
            return (
              <Tooltip key={sev}>
                <TooltipTrigger asChild>
                  <div onClick={() => navigateToFiltered(sev)} className="h-full cursor-pointer" style={{ width: `${pct}%`, backgroundColor: sevColor(sev) }} />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64">
                  <p className="font-semibold capitalize mb-1">{sev}</p>
                  {preview.length > 0 ? (
                    <>
                      <ul className="space-y-0.5 mb-1">
                        {preview.map((name) => (
                          <li key={name} className="text-xs">
                            {name}
                          </li>
                        ))}
                      </ul>
                      {hasMore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateToFiltered(sev)
                          }}
                          className="text-xs underline text-muted-foreground hover:text-foreground mt-0.5"
                        >
                          See more
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs">No items</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
      <div className="flex gap-3">
        {SEVERITIES.map((sev) => (
          <div key={sev} className="flex items-center gap-1 text-xs">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: sevColor(sev) }} />
            <span className="capitalize text-muted-foreground">{sev}</span>
            <span className="font-medium" style={{ color: sevColor(sev) }}>
              {counts[sev]}
            </span>
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
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: sevColor(sev) }} />
                      <span className="capitalize">{sev}</span>
                      <span className="font-semibold" style={{ color: sevColor(sev) }}>
                        {totals[sev]}
                      </span>
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
              <SeverityRow key={key} label={label} severityData={severityData[key]} counts={severityData[key]} items={severityItems?.[key]} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ExposureSeverityChart
