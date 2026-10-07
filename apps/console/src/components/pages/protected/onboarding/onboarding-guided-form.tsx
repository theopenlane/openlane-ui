'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFormContext, useWatch } from 'react-hook-form'
import { defineStepper } from '@stepperize/react'
import { Card } from '@repo/ui/cardpanel'
import { Logo } from '@repo/ui/logo'
import { DynamicStep } from '@/components/pages/protected/onboarding/dynamic-step'
import OnboardingCardProgress from '@/components/pages/protected/onboarding/onboarding-card-progress'
import OnboardingFooter from '@/components/pages/protected/onboarding/onboarding-footer'
import SetupProgressCard from '@/components/pages/protected/onboarding/onboarding-setup-progress'
import { CONTENT_LEFT_COLUMN_CLASS, CONTENT_RIGHT_COLUMN_CLASS, PAGE_FOOTER_CLEARANCE_CLASS } from '@/components/pages/protected/onboarding/onboarding-layout-classes'
import { getVisibleKeysForStep, isStepIncomplete } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingStep, type SubmitStage } from '@/lib/onboarding-questions/types'

type OnboardingGuidedFormProps = {
  startStep: OnboardingStep
  guidedSteps: OnboardingStep[]
  initialStepKey?: string
  submitStage: SubmitStage
  stageCard: ReactNode
  onBackToStart: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  onExit: (values: Record<string, unknown>) => Promise<void>
  onIncompleteExit: () => void
}

const OnboardingGuidedForm = ({ startStep, guidedSteps, initialStepKey, submitStage, stageCard, onBackToStart, onSubmit, onExit, onIncompleteExit }: OnboardingGuidedFormProps) => {
  const { useStepper } = useMemo(() => defineStepper(guidedSteps.map((step) => ({ id: step.key, label: step.title }))), [guidedSteps])
  const stepper = useStepper({ defaultStep: initialStepKey })
  const methods = useFormContext()
  const values = useWatch({ control: methods.control }) as Record<string, unknown>
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const stepLabels = [startStep, ...guidedSteps].map((step) => step.title)
  const currentIndex = guidedSteps.findIndex((step) => step.key === stepper.current.id)
  const currentStep = guidedSteps[currentIndex]
  const stepNumber = currentIndex + 2
  const visibleKeys = currentStep ? getVisibleKeysForStep(currentStep, values) : []

  const handleNext = async () => {
    const isValid = visibleKeys.length > 0 ? await methods.trigger(visibleKeys) : true

    if (!isValid) return

    if (!stepper.isLast) {
      stepper.next()
    } else {
      methods.handleSubmit(onSubmit)()
    }
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      onBackToStart()
    } else {
      stepper.prev()
    }
  }

  const hasStepErrors = visibleKeys.some((key) => methods.formState.errors[key])
  const isCurrentStepIncomplete = currentStep ? isStepIncomplete(currentStep, values) : false

  return (
    <div className={`flex flex-col w-full max-w-6xl m-auto px-4 py-8 ${submitStage === 'form' ? PAGE_FOOTER_CLEARANCE_CLASS : ''}`}>
      <div className="flex flex-col lg:flex-row w-full gap-10">
        <div className={`hidden lg:flex flex-col gap-8 self-start ${CONTENT_LEFT_COLUMN_CLASS}`}>
          <Logo width={150} height={24} />

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold">Welcome to Openlane</h1>
            <p className="text-sm text-muted-foreground">Let&apos;s set up your workspace so you can get value faster</p>
          </div>

          <SetupProgressCard stepLabels={stepLabels} currentIndex={currentIndex + 1} stage={submitStage} />
        </div>

        <div className={`flex flex-col ${CONTENT_RIGHT_COLUMN_CLASS}`}>
          {submitStage === 'form' && currentStep ? (
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault()
                handleNext()
              }}
            >
              <Card className="w-full min-h-96 p-5 sm:p-8 shadow-lg rounded-xl">
                <OnboardingCardProgress label={`Step ${stepNumber} of ${stepLabels.length}`} progress={stepNumber / stepLabels.length} />
                <DynamicStep step={currentStep} />
              </Card>
            </form>
          ) : (
            stageCard
          )}
        </div>
      </div>

      {isMounted &&
        submitStage === 'form' &&
        currentStep &&
        createPortal(
          <OnboardingFooter
            onExit={methods.handleSubmit(onExit, onIncompleteExit)}
            isLastStep={stepper.isLast}
            backLabel={stepLabels[currentIndex]}
            nextLabel={stepLabels[currentIndex + 2]}
            isNextDisabled={hasStepErrors || isCurrentStepIncomplete}
            isSubmitting={methods.formState.isSubmitting}
            onBack={handleBack}
            onNext={handleNext}
          />,
          document.body,
        )}
    </div>
  )
}

export default OnboardingGuidedForm
