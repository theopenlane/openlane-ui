'use client'

import React from 'react'
import Link from 'next/link'
import { type ControlControlStatus } from '@repo/codegen/src/schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { CONTROL_STATUS_STYLES } from '@/components/shared/enum-mapper/control-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export type OrgCoverageData = {
  approvedCount: number
  activeCount: number
  worstStatus: ControlControlStatus | null
  orgControlRefs: Array<{ id: string; refCode: string; status?: string | null }>
}

type Props = {
  data?: OrgCoverageData | null
}

const OrgCoverageCell: React.FC<Props> = ({ data }) => {
  if (!data || data.activeCount === 0) {
    return <span className="text-xs italic text-muted-foreground">No org controls</span>
  }

  const { approvedCount, activeCount, worstStatus, orgControlRefs } = data
  const pct = (approvedCount / activeCount) * 100
  const barClass = pct === 100 ? 'coverage-bar-complete' : pct > 0 ? 'coverage-bar-partial' : 'coverage-bar-empty'
  const statusStyle = worstStatus ? CONTROL_STATUS_STYLES[worstStatus] : null

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
                  {getEnumLabel(worstStatus ?? undefined)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" collisionPadding={64}>
                <div className="text-xs min-w-[160px] max-w-[240px] space-y-1.5">
                  <p className="font-semibold mb-1">Controls by status</p>
                  {orgControlRefs.map((ref) => {
                    const refStyle = ref.status ? CONTROL_STATUS_STYLES[ref.status as ControlControlStatus] : null
                    return (
                      <div key={ref.id} className="flex items-center gap-2">
                        {refStyle ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: refStyle.bg, color: refStyle.color }}>
                            {getEnumLabel(ref.status ?? undefined)}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-muted text-muted-foreground">—</span>
                        )}
                        <Link href={`/controls/${ref.id}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                          {ref.refCode}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {approvedCount}/{activeCount}
        </span>
      </div>
    </div>
  )
}

export default OrgCoverageCell
