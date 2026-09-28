'use client'

import React from 'react'
import { StepBadge } from '@/components/shared/step-badge/step-badge'
import { cn } from '@repo/ui/lib/utils'
import { type TImportStepDescriptor } from './lib/use-record-import'

type TImportStepNavProps = {
  steps: readonly TImportStepDescriptor[]
  current: string
}

export const ImportStepNav: React.FC<TImportStepNavProps> = ({ steps, current }) => {
  const currentIndex = steps.findIndex((step) => step.id === current)

  return (
    <nav aria-label="Import steps">
      <ol className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-3" aria-current={step.id === current ? 'step' : undefined}>
            {index > 0 && <span aria-hidden className="h-px w-8 bg-border sm:w-12" />}
            <StepBadge done={index < currentIndex} active={index === currentIndex} stepNumber={index + 1} size="sm" />
            <span className={cn('text-sm', step.id === current ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
