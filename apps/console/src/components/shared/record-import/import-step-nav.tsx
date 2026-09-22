'use client'

import React from 'react'
import { StepBadge } from '@/components/shared/step-badge/step-badge'
import { cn } from '@repo/ui/lib/utils'
import { IMPORT_STEPS, IMPORT_STEP_LABELS, type TImportStep } from './lib/use-record-import'

type TImportStepNavProps = {
  current: TImportStep
}

export const ImportStepNav: React.FC<TImportStepNavProps> = ({ current }) => {
  const currentIndex = IMPORT_STEPS.indexOf(current)

  return (
    <nav aria-label="Import steps">
      <ol className="flex items-center gap-3">
        {IMPORT_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-3" aria-current={step === current ? 'step' : undefined}>
            {index > 0 && <span aria-hidden className="h-px w-8 bg-border sm:w-12" />}
            <StepBadge done={index < currentIndex} active={index === currentIndex} stepNumber={index + 1} size="sm" />
            <span className={cn('text-sm', step === current ? 'text-foreground' : 'text-muted-foreground')}>{IMPORT_STEP_LABELS[step]}</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
