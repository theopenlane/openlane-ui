'use client'

import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'

type Props = {
  severity: string | null | undefined
  createdAt: string | null | undefined
}

const PastDueBadge: React.FC<Props> = ({ severity, createdAt }) => {
  const { slaDefinitionsNodes } = useSlaDefinitionsWithFilter({})
  if (!severity || !createdAt) return null

  const sla = slaDefinitionsNodes.find((def) => def.securityLevel?.toLowerCase() === severity.toLowerCase())
  if (!sla?.slaDays) return null

  const dueDate = new Date(createdAt)
  dueDate.setDate(dueDate.getDate() + 2)

  if (dueDate >= new Date()) return null

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
          <p className="text-xs text-muted-foreground">Due: {dueDate.toLocaleDateString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default PastDueBadge
