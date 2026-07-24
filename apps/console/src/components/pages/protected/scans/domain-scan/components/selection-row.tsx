'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'

type SelectionRowProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  meta?: string
  badges?: string[]
  trailing?: React.ReactNode
  leading?: React.ReactNode
}

export const SelectionRow = ({ checked, onCheckedChange, title, description, meta, badges, trailing, leading }: SelectionRowProps) => (
  <div className="flex items-start gap-4 px-6 py-1">
    <div className="pt-0.5">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
    </div>
    {leading ? <div className="pt-0.5">{leading}</div> : null}
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-semibold">{title}</div>
        {badges?.map((badge) => (
          <Badge key={badge} variant="outline">
            {badge}
          </Badge>
        ))}
      </div>
      {description ? <div className="mt-0.5 text-sm text-muted-foreground">{description}</div> : null}
    </div>
    <div className="shrink-0 text-sm text-muted-foreground">{trailing ?? meta}</div>
  </div>
)
