import React from 'react'
import StepIndicator from '@/components/shared/step-indicator/step-indicator'
import { type Stepper, type Step } from '@stepperize/react'
import { cn } from '@repo/ui/lib/utils'

interface StepHeaderProps<T extends Step[] = Step[]> {
  stepper: Stepper<T>
  disabledIDs?: string[]
  className?: string
}

export function StepHeader<T extends Step[]>({ stepper, disabledIDs = [], className }: StepHeaderProps<T>) {
  const visibleSteps = stepper.all.filter((s) => !disabledIDs.includes(s.id))
  const currentVisibleIndex = visibleSteps.findIndex((s) => s.id === stepper.current.id)

  return (
    <div className={cn('flex justify-between items-center', className)}>
      <div className="flex items-center gap-5">
        {visibleSteps.map((s) => {
          const isActive = stepper.current.id === s.id
          return (
            <div key={s.id} onClick={() => !disabledIDs.includes(s.id) && stepper.goTo(s.id)} className="flex items-center cursor-pointer">
              <StepIndicator active={isActive} />
            </div>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Step {currentVisibleIndex + 1} of {visibleSteps.length}
      </p>
    </div>
  )
}
