'use client'

import React, { useId } from 'react'
import { Lock } from 'lucide-react'

import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'

import { type TTrustServicesCategory } from '@/constants/trust-services-categories'

type TTrustServicesCategoryOptionProps = {
  category: TTrustServicesCategory
  checked: boolean
  onCheckedChange: () => void
  requiredLabel?: string
  locked?: boolean
  disabled?: boolean
}

export const TrustServicesCategoryOption = ({ category, checked, onCheckedChange, requiredLabel, locked, disabled }: TTrustServicesCategoryOptionProps) => {
  const checkboxId = useId()
  const { name, description, icon: Icon } = category

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-md border transition-colors', checked ? 'border-primary bg-primary/10' : 'border-border')}>
      <Checkbox
        id={checkboxId}
        data-testid={`trust-service-category-${name.replace(/\s+/g, '-').toLowerCase()}`}
        className="mt-0.5"
        checked={checked}
        disabled={locked || disabled}
        onCheckedChange={onCheckedChange}
      />
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <label htmlFor={checkboxId} className={cn('flex flex-1 flex-col gap-1 min-w-0', locked ? 'cursor-default' : 'cursor-pointer')}>
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {name}
          {requiredLabel && (
            <Badge variant="outline" className="border-primary/40 bg-primary/15 text-primary">
              {requiredLabel}
            </Badge>
          )}
        </span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </label>
      {locked && <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
    </div>
  )
}
