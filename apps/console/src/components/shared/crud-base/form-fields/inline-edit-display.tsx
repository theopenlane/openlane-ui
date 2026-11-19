'use client'

import { type MouseEvent, type ReactNode } from 'react'
import { activatable } from '@repo/ui/lib/a11y'
import { useFormField } from '@repo/ui/form'
import { cn } from '@repo/ui/lib/utils'

interface InlineEditDisplayProps {
  onActivate?: () => void
  className?: string
  children: ReactNode
}

export const InlineEditDisplay = ({ onActivate, className, children }: InlineEditDisplayProps) => {
  const { formItemId, formLabelId, hasLabel } = useFormField()

  return (
    <div id={formItemId} aria-labelledby={onActivate && hasLabel ? `${formLabelId} ${formItemId}` : undefined} className={className} {...activatable(onActivate)}>
      {children}
    </div>
  )
}

interface InlineEditDisplayWithActionsProps extends InlineEditDisplayProps {
  valueClassName?: string
  actions: ReactNode
}

export const InlineEditDisplayWithActions = ({ onActivate, className, valueClassName, children, actions }: InlineEditDisplayWithActionsProps) => {
  const handleContainerClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onActivate?.()
    }
  }

  return (
    <div role="presentation" className={cn('flex items-center justify-between gap-2', className)} onClick={onActivate ? handleContainerClick : undefined}>
      <InlineEditDisplay onActivate={onActivate} className={cn('min-w-0', valueClassName)}>
        {children}
      </InlineEditDisplay>
      <div className="shrink-0">{actions}</div>
    </div>
  )
}
