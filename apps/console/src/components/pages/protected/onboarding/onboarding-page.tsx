'use client'

import OnboardingGuidedForm from '@/components/pages/protected/onboarding/onboarding-guided-form'
import OnboardingReadyCard from '@/components/pages/protected/onboarding/onboarding-ready-card'
import OnboardingStartCard from '@/components/pages/protected/onboarding/onboarding-start-card'
import OnboardingTransitionCard from '@/components/pages/protected/onboarding/onboarding-transition-card'
import { useOnboardingSubmit } from '@/components/pages/protected/onboarding/hooks/use-onboarding-submit'
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions'
import { allQuestionsForStep, buildOnboardingDefaultValues, buildOnboardingSchema, getVisibleKeysForStep, isAnswered, isStepIncomplete } from '@/lib/onboarding-questions/build-schema'
import { COMPANY_DOMAINS_KEY, COMPANY_NAME_KEY } from '@/lib/onboarding-questions/question-keys'
import { type OnboardingCard, type OnboardingStep } from '@/lib/onboarding-questions/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Logo } from '@repo/ui/logo'
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

type OnboardingPath = 'start' | 'guided'

type OnboardingFormProps = {
  startStep: OnboardingStep
  guidedSteps: OnboardingStep[]
  trialCards: OnboardingCard[]
  trialTitle: string
  trialDescription: string
}

const OnboardingForm = ({ startStep, guidedSteps, trialCards, trialTitle, trialDescription }: OnboardingFormProps) => {
  const allSteps = useMemo(() => [startStep, ...guidedSteps], [startStep, guidedSteps])
  const onboardingSchema = useMemo(() => buildOnboardingSchema(allSteps), [allSteps])
  const defaultOnboardingValues = useMemo(() => buildOnboardingDefaultValues(allSteps), [allSteps])
  const allQuestions = useMemo(() => allSteps.flatMap(allQuestionsForStep), [allSteps])
  const { data: sessionData } = useSession()
  const [path, setPath] = useState<OnboardingPath>('start')
  const [resumeStepKey, setResumeStepKey] = useState<string>()
  const hasSeededFromSessionRef = useRef(false)

  const { submitStage, submitOnboarding, exitOnboarding, notifyIncompleteExit, leaveOnboarding, domainScanNotification, reviewDomainScanFindings } = useOnboardingSubmit(allQuestions)

  const methods = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: 'onChange',
  })
  const values = useWatch({ control: methods.control }) as Record<string, unknown>

  useEffect(() => {
    const userDomain = sessionData?.user.email?.split('@')[1]
    if (!userDomain || hasSeededFromSessionRef.current) return
    hasSeededFromSessionRef.current = true

    const currentDomains = methods.getValues(COMPANY_DOMAINS_KEY)
    const existingDomains = Array.isArray(currentDomains) ? currentDomains : []
    if (!existingDomains.includes(userDomain)) {
      methods.setValue(COMPANY_DOMAINS_KEY, [...existingDomains, userDomain], { shouldValidate: true })
    }

    if (!methods.getValues(COMPANY_NAME_KEY)) {
      const derivedName = userDomain
        .split('.')[0]
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      methods.setValue(COMPANY_NAME_KEY, derivedName, { shouldValidate: true })
    }
  }, [sessionData, methods])

  const totalSteps = allSteps.length
  const startKeys = getVisibleKeysForStep(startStep, values)
  const isStartBlocked = isStepIncomplete(startStep, values) || startKeys.some((key) => methods.formState.errors[key])

  const handleContinue = async () => {
    if (!(await methods.trigger(startKeys))) return
    setResumeStepKey(undefined)
    setPath('guided')
  }

  const handleCreate = async () => {
    if (!(await methods.trigger(startKeys))) return

    const answeredKeys = allQuestions.filter((question) => isAnswered(values[question.key])).map((question) => question.key)
    if (await methods.trigger(answeredKeys)) {
      submitOnboarding(methods.getValues())
      return
    }

    setResumeStepKey(guidedSteps.find((step) => allQuestionsForStep(step).some((question) => methods.getFieldState(question.key).invalid))?.key)
    setPath('guided')
    notifyIncompleteExit()
  }

  const domains = values[COMPANY_DOMAINS_KEY]
  const primaryDomain = Array.isArray(domains) && typeof domains[0] === 'string' ? domains[0] : undefined
  const stageStepLabel = path === 'guided' ? `Step ${totalSteps} of ${totalSteps}` : undefined

  const stageCard = (
    <>
      {submitStage === 'transition' && <OnboardingTransitionCard stepLabel={stageStepLabel} title={trialTitle} description={trialDescription} cards={trialCards} primaryDomain={primaryDomain} />}
      {submitStage === 'ready' && (
        <OnboardingReadyCard
          stepLabel={stageStepLabel}
          scanData={domainScanNotification?.data}
          hasScanReport={!!domainScanNotification}
          primaryDomain={primaryDomain}
          onReview={reviewDomainScanFindings}
          onLeave={leaveOnboarding}
        />
      )}
    </>
  )

  return (
    <FormProvider {...methods}>
      {path === 'guided' ? (
        <OnboardingGuidedForm
          startStep={startStep}
          guidedSteps={guidedSteps}
          initialStepKey={resumeStepKey}
          submitStage={submitStage}
          stageCard={stageCard}
          onBackToStart={() => setPath('start')}
          onSubmit={submitOnboarding}
          onExit={exitOnboarding}
          onIncompleteExit={notifyIncompleteExit}
        />
      ) : (
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 m-auto px-4 py-8">
          <Logo width={150} height={24} />
          {submitStage === 'form' ? (
            <OnboardingStartCard step={startStep} totalSteps={totalSteps} canContinue={guidedSteps.length > 0} isDisabled={isStartBlocked} onContinue={handleContinue} onCreate={handleCreate} />
          ) : (
            stageCard
          )}
        </div>
      )}
    </FormProvider>
  )
}

const OnboardingPage = () => {
  const { startStep, guidedSteps, trialCards, trialTitle, trialDescription, isLoading, error } = useOnboardingQuestions()

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-32">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  if (error || !startStep) {
    return (
      <div className="flex w-full items-center justify-center py-32">
        <p className="text-sm text-text-light">We couldn&apos;t load the onboarding questions. Please refresh the page.</p>
      </div>
    )
  }

  return <OnboardingForm startStep={startStep} guidedSteps={guidedSteps} trialCards={trialCards} trialTitle={trialTitle} trialDescription={trialDescription} />
}

export default OnboardingPage
