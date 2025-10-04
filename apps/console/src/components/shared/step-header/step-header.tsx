import React from 'react'
import StepIndicator from '@/components/shared/step-indicator/step-indicator'

interface StepHeader {
  stepper: {
    all: { id: string; label: string }[]
    current: { id: string }
  }
  currentIndex: number
}

export const StepHeader: React.FC<StepHeader> = ({ stepper, currentIndex }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-5 ">
        {stepper.all.map((s, index) => {
          const isActive = index === currentIndex
          return (
            <div key={s.id} className="flex items-center">
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
