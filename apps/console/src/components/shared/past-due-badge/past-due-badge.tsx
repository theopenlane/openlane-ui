'use client'

import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'
import { getVulnerabilityDueDate } from '@/utils/vulnerability-due-date'

type Props = {
  severity?: string | null | undefined
  createdAt?: string | null | undefined
  discoveredAt?: string | null | undefined
  remediationSLA?: number | null | undefined
  show?: boolean
}

const PastDueBadge: React.FC<Props> = ({ severity, createdAt, discoveredAt, remediationSLA, show }) => {
  const { slaDefinitionsNodes } = useSlaDefinitionsWithFilter({})

  if (show) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium bg-danger/15 text-danger border border-danger/30 cursor-default">Past Due</span>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!severity || !createdAt) return null

  const { pastDue, slaDays, dueDate } = getVulnerabilityDueDate({ severity, createdAt, discoveredAt, remediationSLA }, slaDefinitionsNodes)
  if (!pastDue || !dueDate) return null

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium bg-danger/15 text-danger border border-danger/30 cursor-default">Past Due</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-56">
          <p className="font-medium mb-1">SLA Exceeded</p>
          <p className="text-xs text-muted-foreground">
            {slaDays}-day SLA for {severity.toLowerCase()} severity
          </p>
          <p className="text-xs text-muted-foreground">Due: {dueDate.toLocaleDateString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default PastDueBadge
