'use client'

import { DynamicStep } from '@/components/pages/protected/onboarding/dynamic-step'
import SetupProgressCard from '@/components/pages/protected/onboarding/onboarding-setup-progress'
import OnboardingFooter from '@/components/pages/protected/onboarding/onboarding-footer'
import OnboardingReadyCard from '@/components/pages/protected/onboarding/onboarding-ready-card'
import OnboardingTransitionCard from '@/components/pages/protected/onboarding/onboarding-transition-card'
import { CONTENT_LEFT_COLUMN_CLASS, CONTENT_RIGHT_COLUMN_CLASS } from '@/components/pages/protected/onboarding/onboarding-layout-classes'
import { useOnboardingSubmit } from '@/components/pages/protected/onboarding/hooks/use-onboarding-submit'
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions'
import { allQuestionsForStep, buildOnboardingDefaultValues, buildOnboardingSchema, getRequiredKeysForStep, getVisibleKeysForStep, isAnswered } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingCard, type OnboardingStep } from '@/lib/onboarding-questions/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Logo } from '@repo/ui/logo'
import { defineStepper } from '@stepperize/react'
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

type MultiStepFormProps = {
  questionSteps: OnboardingStep[]
  trialCards: OnboardingCard[]
  trialTitle: string
  trialDescription: string
}

const MultiStepForm = ({ questionSteps, trialCards, trialTitle, trialDescription }: MultiStepFormProps) => {
  const { useStepper, steps } = useMemo(() => defineStepper(...questionSteps.map((step) => ({ id: step.key, label: step.title }))), [questionSteps])
  const stepper = useStepper()
  const onboardingSchema = useMemo(() => buildOnboardingSchema(questionSteps), [questionSteps])
  const defaultOnboardingValues = useMemo(() => buildOnboardingDefaultValues(questionSteps), [questionSteps])
  const allQuestions = useMemo(() => questionSteps.flatMap(allQuestionsForStep), [questionSteps])
  const { data: sessionData } = useSession()
  const [isMounted, setIsMounted] = useState(false)

  const { submitStage, submitOnboarding, exitOnboarding, notifyIncompleteExit, leaveOnboarding, domainScanNotification, reviewDomainScanFindings } = useOnboardingSubmit(allQuestions)

  const methods = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: 'onChange',
  })
  const values = useWatch({ control: methods.control }) as Record<string, unknown>

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const userDomain = sessionData?.user.email?.split('@')[1]
    if (!userDomain) return

    const currentDomains = methods.getValues('company_domains')
    const existingDomains = Array.isArray(currentDomains) ? currentDomains : []
    if (!existingDomains.includes(userDomain)) {
      methods.setValue('company_domains', [...existingDomains, userDomain])
    }

    if (!methods.getValues('company_name')) {
      const derivedName = userDomain
        .split('.')[0]
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      methods.setValue('company_name', derivedName, { shouldValidate: true })
    }
  }, [sessionData, methods])

  const currentStep = questionSteps.find((step) => step.key === stepper.state.current.data.id)

  const handleNext = async () => {
    const visibleKeys = currentStep ? getVisibleKeysForStep(currentStep, values) : []
    const isValid = visibleKeys.length > 0 ? await methods.trigger(visibleKeys) : true

    if (!isValid) return

    if (!stepper.state.isLast) {
      stepper.navigation.next()
    } else {
      methods.handleSubmit(submitOnboarding)()
    }
  }

  const handleBack = () => {
    if (!stepper.state.isFirst) {
      stepper.navigation.prev()
    }
  }

  const currentIndex = stepper.state.all.findIndex((item) => item.id === stepper.state.current.data.id)
  const hasFormErrors = Object.keys(methods.formState.errors).length > 0
  const isCurrentStepIncomplete = (currentStep ? getRequiredKeysForStep(currentStep, values) : []).some((key) => !isAnswered(values[key]))
  const domains = values.company_domains
  const primaryDomain = Array.isArray(domains) && typeof domains[0] === 'string' ? domains[0] : undefined

  return (
    <div className={`flex flex-col w-full max-w-6xl m-auto px-4 py-8 ${submitStage === 'form' ? 'pb-28' : ''}`}>
      <div className="flex flex-col lg:flex-row w-full gap-10">
        <div className={`hidden lg:flex flex-col gap-8 self-start ${CONTENT_LEFT_COLUMN_CLASS}`}>
          <Logo width={150} height={24} />

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold">Welcome to Openlane</h1>
            <p className="text-sm text-muted-foreground">Let&apos;s set up your workspace so you can get value faster</p>
          </div>

          <SetupProgressCard stepLabels={questionSteps.map((step) => step.title)} currentIndex={currentIndex} stage={submitStage} />
        </div>

        <div className={`flex flex-col ${CONTENT_RIGHT_COLUMN_CLASS}`}>
          {submitStage === 'transition' && (
            <OnboardingTransitionCard totalSteps={steps.length} title={trialTitle} description={trialDescription} cards={trialCards} primaryDomain={primaryDomain} onLeave={leaveOnboarding} />
          )}

          {submitStage === 'ready' && (
            <OnboardingReadyCard
              totalSteps={steps.length}
              scanData={domainScanNotification?.data}
              hasScanReport={!!domainScanNotification}
              primaryDomain={primaryDomain}
              onReview={reviewDomainScanFindings}
              onLeave={leaveOnboarding}
            />
          )}

          {submitStage === 'form' && currentStep && (
            <FormProvider {...methods}>
              <form className="w-full" onSubmit={methods.handleSubmit(submitOnboarding)}>
                <Card className="w-full min-h-96 p-7 md:p-8 shadow-lg rounded-xl">
                  <div className="flex flex-col gap-3 mb-8">
                    <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
                      Step {currentIndex + 1} of {steps.length}
                    </Badge>
                    <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }} />
                    </div>
                  </div>

                  <DynamicStep step={currentStep} />
                </Card>
              </form>
            </FormProvider>
          )}
        </div>
      </div>

      {isMounted &&
        submitStage === 'form' &&
        createPortal(
          <OnboardingFooter
            showExit={currentIndex > 0}
            onExit={methods.handleSubmit(exitOnboarding, notifyIncompleteExit)}
            isFirstStep={stepper.state.isFirst}
            isLastStep={stepper.state.isLast}
            backLabel={steps[currentIndex - 1]?.label}
            nextLabel={steps[currentIndex + 1]?.label}
            isNextDisabled={hasFormErrors || isCurrentStepIncomplete}
            onBack={handleBack}
            onNext={handleNext}
          />,
          document.body,
        )}
    </div>
  )
}

const OnboardingPage = () => {
  const { steps: questionSteps, trialCards, trialTitle, trialDescription, isLoading, error } = useOnboardingQuestions()

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-32">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  if (error || questionSteps.length === 0) {
    return (
      <div className="flex w-full items-center justify-center py-32">
        <p className="text-sm text-text-light">We couldn&apos;t load the onboarding questions. Please refresh the page.</p>
      </div>
    )
  }

  return <MultiStepForm questionSteps={questionSteps} trialCards={trialCards} trialTitle={trialTitle} trialDescription={trialDescription} />
}

export default OnboardingPage
