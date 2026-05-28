'use client'

import React from 'react'
import Link from 'next/link'
import { type EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { EVIDENCE_STATUS_STYLES } from '@/components/shared/enum-mapper/evidence-enum'
import { EVIDENCE_SEVERITY_ORDER } from '@/lib/graphql-hooks/mapped-control'

const EVIDENCE_TOOLTIP_MAX = 5

export type EvidenceCoverageProps = {
  totalCount: number
  approvedCount?: number
  worstStatus?: EvidenceEvidenceStatus | null
  evidenceRefs?: Array<{ id: string; name: string; status?: string | null; controlId: string }>
  primaryControlId?: string
}

const EvidenceCoverageCell: React.FC<EvidenceCoverageProps> = ({ totalCount, approvedCount = 0, worstStatus, evidenceRefs, primaryControlId }) => {
  if (totalCount === 0) {
    return <span className="text-xs italic text-muted-foreground">No evidence</span>
  }

  const pct = (approvedCount / totalCount) * 100
  const barClass = pct === 100 ? 'coverage-bar-complete' : pct > 0 ? 'coverage-bar-partial' : 'coverage-bar-empty'
  const statusStyle = worstStatus ? EVIDENCE_STATUS_STYLES[worstStatus] : null
  const sortedRefs = [...(evidenceRefs ?? [])].sort((a, b) => {
    const ai = EVIDENCE_SEVERITY_ORDER.indexOf(a.status as EvidenceEvidenceStatus)
    const bi = EVIDENCE_SEVERITY_ORDER.indexOf(b.status as EvidenceEvidenceStatus)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
  const visibleRefs = sortedRefs.slice(0, EVIDENCE_TOOLTIP_MAX)
  const overflowCount = sortedRefs.length - visibleRefs.length

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-2">
        {statusStyle && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 cursor-default" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                  {statusStyle.label}
                </span>
              </TooltipTrigger>
              {visibleRefs.length > 0 && (
                <TooltipContent side="top" collisionPadding={64}>
                  <div className="text-xs min-w-[180px] max-w-[280px] space-y-1.5">
                    <p className="font-semibold mb-1">Evidence</p>
                    {visibleRefs.map((ev) => {
                      const style = ev.status ? EVIDENCE_STATUS_STYLES[ev.status as EvidenceEvidenceStatus] : null
                      return (
                        <div key={ev.id} className="flex items-center gap-2">
                          {style ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: style.bg, color: style.color }}>
                              {style.label}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-muted text-muted-foreground">—</span>
                          )}
                          <Link href={`/controls/${ev.controlId}?tab=evidence`} className="truncate hover:underline" target="_blank" rel="noopener noreferrer">
                            {ev.name}
                          </Link>
                        </div>
                      )
                    })}
                    {overflowCount > 0 && primaryControlId && (
                      <Link href={`/controls/${primaryControlId}?tab=evidence`} className="block text-muted-foreground hover:underline pt-1" target="_blank" rel="noopener noreferrer">
                        See all ({overflowCount} more)
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
