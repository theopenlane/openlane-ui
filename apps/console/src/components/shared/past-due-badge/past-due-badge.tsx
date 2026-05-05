'use client'

import React, { useMemo } from 'react'
import { addDays, isPast, parseISO } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'
import { formatDate } from '@/utils/date'

type Props = {
  severity?: string | null | undefined
  createdAt?: string | null | undefined
  show?: boolean
}

const PastDueBadge: React.FC<Props> = ({ severity, createdAt, show }) => {
  const { slaDefinitionsNodes } = useSlaDefinitionsWithFilter({})
  const dueDate = useMemo(() => (createdAt ? addDays(parseISO(createdAt), 2) : null), [createdAt])

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

  if (!severity || !createdAt || !dueDate) return null

  const sla = slaDefinitionsNodes.find((def) => def.securityLevel?.toLowerCase() === severity.toLowerCase())
  if (!sla?.slaDays) return null

  if (!isPast(dueDate)) return null

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium bg-danger/15 text-danger border border-danger/30 cursor-default">Past Due</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-56">
          <p className="font-medium mb-1">SLA Exceeded</p>
          <p className="text-xs text-muted-foreground">
            {sla.slaDays}-day SLA for {severity.toLowerCase()} severity
          </p>
          <p className="text-xs text-muted-foreground">Due: {formatDate(dueDate.toISOString())}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default PastDueBadge
