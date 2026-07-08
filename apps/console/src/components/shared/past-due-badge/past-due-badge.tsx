'use client'

import React, { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'
import { buildSlaDaysByLevel, getSlaDueDate, isSlaPastDue } from '@/lib/sla'

type Props = {
  severity?: string | null | undefined
  createdAt?: string | null | undefined
  show?: boolean
}

const PastDueBadge: React.FC<Props> = ({ severity, createdAt, show }) => {
  const { slaDefinitionsNodes } = useSlaDefinitionsWithFilter({})
  const slaDaysByLevel = useMemo(() => buildSlaDaysByLevel(slaDefinitionsNodes), [slaDefinitionsNodes])

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

  const dueDate = getSlaDueDate(createdAt, severity, slaDaysByLevel)
  if (!dueDate || !isSlaPastDue(dueDate)) return null

  const slaDays = slaDaysByLevel[severity.toUpperCase()]

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
