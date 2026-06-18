'use client'

import React from 'react'
import Link from 'next/link'
import { type EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EVIDENCE_STATUS_STYLES } from '@/components/shared/enum-mapper/evidence-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { EVIDENCE_SEVERITY_ORDER } from '@/lib/graphql-hooks/mapped-control'
import { type ControlReportItem } from '@/lib/graphql-hooks/control'

export type EvidenceCoverageProps = {
  data?: ControlReportItem['evidenceStatus']
  primaryControlId?: string
}

const EvidenceCoverageCell: React.FC<EvidenceCoverageProps> = ({ data, primaryControlId }) => {
  const totalCount = data?.totalCount ?? 0

  if (!data || totalCount === 0) {
    return <span className="text-xs italic text-muted-foreground">No evidence</span>
  }

  const approvedCount = data.approvedCount
  const worstStatus = data.worstStatus
  const pct = (approvedCount / totalCount) * 100
  const statusStyle = worstStatus ? EVIDENCE_STATUS_STYLES[worstStatus] : null

  const sortedCounts = [...(data.countByStatus ?? [])].sort((a, b) => {
    const ai = EVIDENCE_SEVERITY_ORDER.indexOf(a.status)
    const bi = EVIDENCE_SEVERITY_ORDER.indexOf(b.status)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: statusStyle?.color }} />
      </div>
      <div className="flex items-center gap-2">
        {statusStyle && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 cursor-default" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                  {getEnumLabel(worstStatus ?? undefined)}
                </span>
              </TooltipTrigger>
              {sortedCounts.length > 0 && (
                <TooltipContent side="top" collisionPadding={64} portal>
                  <div className="text-xs min-w-[180px] max-w-[280px] space-y-1.5">
                    <p className="font-semibold mb-1">Evidence by status</p>
                    {sortedCounts.map((entry) => {
                      const style = EVIDENCE_STATUS_STYLES[entry.status as EvidenceEvidenceStatus]
                      return (
                        <div key={entry.status} className="flex items-center justify-between gap-2">
                          {style ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: style.bg, color: style.color }}>
                              {getEnumLabel(entry.status)}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-muted text-muted-foreground">—</span>
                          )}
                          <span className="text-muted-foreground">{entry.totalCount}</span>
                        </div>
                      )
                    })}
                    {primaryControlId && (
                      <Link href={`/controls/${primaryControlId}?tab=evidence`} className="block text-muted-foreground hover:underline pt-1" target="_blank" rel="noopener noreferrer">
                        View evidence
                      </Link>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {approvedCount}/{totalCount}
        </span>
      </div>
    </div>
  )
}

export default EvidenceCoverageCell
