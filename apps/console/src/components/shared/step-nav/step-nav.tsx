'use client'

import React from 'react'
import { StepBadge } from '@/components/shared/step-badge/step-badge'
import { cn } from '@repo/ui/lib/utils'

type TStepNavStep = { id: string; label: string }

type TStepNavProps = {
  steps: readonly TStepNavStep[]
  current: string
  ariaLabel: string
}

export const StepNav: React.FC<TStepNavProps> = ({ steps, current, ariaLabel }) => {
  const currentIndex = steps.findIndex((step) => step.id === current)

  return (
    <nav aria-label={ariaLabel}>
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
