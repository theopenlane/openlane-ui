import React from 'react'
import StepIndicator from '@/components/shared/step-indicator/step-indicator'
import { Stepper, Step } from '@stepperize/react'

interface StepHeaderProps<T extends Step[] = Step[]> {
  stepper: Stepper<T>
  currentIndex: number
}

export function StepHeader<T extends Step[]>({ stepper, currentIndex }: StepHeaderProps<T>) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-5">
        {stepper.all.map((s, index) => {
          const isActive = index === currentIndex
          return (
            <div key={s.id} onClick={() => stepper.goTo(s.id)} className="flex items-center cursor-pointer">
              <StepIndicator active={isActive} />
            </div>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Step {currentIndex + 1} of {stepper.all.length}
      </p>
    </div>
  )
}
