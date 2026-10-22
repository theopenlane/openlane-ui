'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { cn } from '@repo/ui/lib/utils'
import { activatable } from '@repo/ui/lib/a11y'

type TSelectableStatCardProps = {
  children: React.ReactNode
  isActive?: boolean
  onSelect?: () => void
  tooltip?: string
  className?: string
  cardClassName?: string
}

export const SelectableStatCard = ({ children, isActive = false, onSelect, tooltip, className, cardClassName }: TSelectableStatCardProps) => {
  const card = (
    <div className={cn('rounded-lg', className)} aria-pressed={onSelect ? isActive : undefined} {...activatable(onSelect)}>
      <Card className={cn('h-full', onSelect && 'cursor-pointer transition-colors hover:border-primary', isActive && 'border-primary ring-1 ring-primary', cardClassName)}>{children}</Card>
    </div>
  )

  return tooltip ? <SystemTooltip icon={card} content={tooltip} portal /> : card
}
