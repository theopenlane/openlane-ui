import type { Stepper, Step } from '@stepperize/react'

type LabeledStep = Step & { label: string }

type WizardStepNavProps<T extends LabeledStep[]> = {
  stepper: Stepper<T>
  enabledMap: Record<string, boolean>
}

export const WizardStepNav = <T extends LabeledStep[]>({ stepper, enabledMap }: WizardStepNavProps<T>) => {
  const steps = stepper.state.all
  const currentIndex = steps.findIndex((step) => step.id === stepper.state.current.data.id)

  return (
    <div className="flex flex-wrap items-center gap-4 text-md text-muted-foreground mb-4">
      {steps.map((step, index: number) => {
        const isCurrent: boolean = index === currentIndex
        const isComplete: boolean = index < currentIndex
        const isEnabled: boolean = enabledMap[step.id] ?? true
        const canNavigate: boolean = isEnabled && index <= currentIndex

        const dotClass: string = isCurrent ? 'bg-primary ring-4 ring-primary/15' : isComplete ? 'bg-primary/80' : isEnabled ? 'bg-muted-foreground/40' : 'bg-muted-foreground/20'

        const textClass: string = isCurrent ? 'text-foreground font-medium' : isComplete ? 'text-primary' : isEnabled ? 'text-muted-foreground' : 'text-muted-foreground/50'

        return (
          <div key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canNavigate && stepper.navigation.goTo(step.id)}
              disabled={!canNavigate}
              className={`flex items-center gap-2 transition ${textClass} ${canNavigate ? 'hover:text-foreground' : 'cursor-not-allowed'}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
              <span>{step.label}</span>
            </button>
            {index < steps.length - 1 && <span className="text-muted-foreground/40">→</span>}
          </div>
        )
      })}
    </div>
  )
}
