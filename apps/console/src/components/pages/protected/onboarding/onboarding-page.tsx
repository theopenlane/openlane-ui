'use client'

import { DynamicStep } from '@/components/pages/protected/onboarding/dynamic-step'
import SetupProgressCard from '@/components/pages/protected/onboarding/onboarding-setup-progress'
import { useDashboardContentOffset } from '@/providers/DashboardContentOffsetContext'
import { useWebSocketClient } from '@/providers/websocket-provider'
import { useDomainScanNotification } from '@/hooks/useDomainScanNotification'
import { useNotification } from '@/hooks/useNotification'
import { useOnboardingQuestions } from '@/hooks/useOnboardingQuestions'
import { useCreateOnboarding } from '@/lib/graphql-hooks/onboarding'
import { buildOnboardingDefaultValues, buildOnboardingSchema, getRequiredKeysForStep } from '@/lib/onboarding-questions/build-schema'
import { type OnboardingCard, type OnboardingStep } from '@/lib/onboarding-questions/types'
import { setOnboardingFrameworks } from '@/lib/storage/onboarding-frameworks'
import { handleSSORedirect, switchOrganization } from '@/lib/user'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { zodResolver } from '@hookform/resolvers/zod'
import { type CreateOnboardingInput } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Logo } from '@repo/ui/logo'
import { defineStepper } from '@stepperize/react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Box, Handshake, Loader2, Server, ShieldAlert, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

type SubmitStage = 'form' | 'transition' | 'ready'

const DOMAIN_SCAN_WAIT_MS = 60000

// Shared between the page body's two-column layout and the fixed footer so they can never drift out of alignment
const CONTENT_LEFT_COLUMN_CLASS = 'w-full max-w-sm shrink-0'
const CONTENT_RIGHT_COLUMN_CLASS = 'w-full max-w-2xl mx-auto'

// Icons are a presentational concern the API payload doesn't (and shouldn't) carry -- keyed by
// the trial step's card key, with a generic fallback for any card the backend adds later
const TRIAL_CARD_ICONS: Record<string, typeof ShieldCheck> = {
  compliance: ShieldCheck,
  trust_center: Handshake,
}

type DomainScanStatsPayload = {
  systems?: unknown[]
  vendors?: unknown[]
  assets?: { dns_records?: unknown[]; internal_domains?: unknown[]; ip_addresses?: unknown[] }
  findings?: { risks?: unknown[]; security_violations?: unknown[]; agent_readiness?: { checklist?: string; level_name?: string } }
}

const domainScanStats = (data?: DomainScanStatsPayload) => {
  const agentReadiness = data?.findings?.agent_readiness
  const hasAgentReadinessFinding = !!(agentReadiness?.checklist || agentReadiness?.level_name)

  return {
    systems: data?.systems?.length ?? 0,
    vendors: data?.vendors?.length ?? 0,
    assets: (data?.assets?.dns_records?.length ?? 0) + (data?.assets?.internal_domains?.length ?? 0) + (data?.assets?.ip_addresses?.length ?? 0),
    findings: (data?.findings?.risks?.length ?? 0) + (data?.findings?.security_violations?.length ?? 0) + (hasAgentReadinessFinding ? 1 : 0),
  }
}

export default function OnboardingPage() {
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

function MultiStepForm({ questionSteps, trialCards, trialTitle, trialDescription }: { questionSteps: OnboardingStep[]; trialCards: OnboardingCard[]; trialTitle: string; trialDescription: string }) {
  const queryClient = useQueryClient()
  const { useStepper, steps } = useMemo(() => defineStepper(...questionSteps.map((step) => ({ id: step.key, label: step.title }))), [questionSteps])
  const stepper = useStepper()
  const onboardingSchema = useMemo(() => buildOnboardingSchema(questionSteps), [questionSteps])
  const defaultOnboardingValues = useMemo(() => buildOnboardingDefaultValues(questionSteps), [questionSteps])
  const { mutateAsync: createOnboarding } = useCreateOnboarding()
  const router = useRouter()
  const { data: sessionData, update: updateSession } = useSession()
  const { setPendingToken } = useWebSocketClient()
  const [submitStage, setSubmitStage] = useState<SubmitStage>('form')
  const [isMounted, setIsMounted] = useState(false)
  const contentOffset = useDashboardContentOffset()
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [domainScanWaitOver, setDomainScanWaitOver] = useState(false)
  const { errorNotification } = useNotification()
  const { domainScanNotification, canReviewDomainScanFindings, reviewDomainScanFindings } = useDomainScanNotification()

  const methods = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: 'onChange',
  })
  const values = useWatch({ control: methods.control }) as Record<string, unknown>

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Pre-fills the company domain/name from the user's own email domain -- only runs for the
  // company_info step's fields, if the fetched question set still has them
  useEffect(() => {
    const userDomain = sessionData?.user.email?.split('@')[1]
    if (!userDomain) return

    const currentDomains = (methods.getValues('company_domains') as string[] | undefined) ?? []
    if (!currentDomains.includes(userDomain)) {
      methods.setValue('company_domains', [...currentDomains, userDomain])
    }

    if (!methods.getValues('company_name')) {
      const root = userDomain.split('.')[0]
      const derivedName = root
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      methods.setValue('company_name', derivedName, { shouldValidate: true })
    }
  }, [sessionData, methods])

  useEffect(() => {
    if (submitStage !== 'transition' || !workspaceReady) return

    const timeout = setTimeout(() => setDomainScanWaitOver(true), DOMAIN_SCAN_WAIT_MS)
    return () => clearTimeout(timeout)
  }, [submitStage, workspaceReady])

  useEffect(() => {
    if (submitStage !== 'transition' || !workspaceReady) return
    if (canReviewDomainScanFindings || domainScanWaitOver) {
      setSubmitStage('ready')
    }
  }, [submitStage, workspaceReady, canReviewDomainScanFindings, domainScanWaitOver])

  useEffect(() => {
    if (submitStage !== 'ready' || !sessionData?.user || !sessionData.user.isOnboarding) return

    updateSession({
      user: {
        ...sessionData.user,
        isOnboarding: false,
      },
    })
  }, [submitStage, sessionData, updateSession])

  const performOnboarding = async (formValues: Record<string, unknown>) => {
    const sector = formValues.company_sector === 'other' ? (formValues.company_sector_other as string) || '' : (formValues.company_sector as string) || ''
    const role = formValues.user_role === 'other' ? (formValues.user_role_other as string) || '' : (formValues.user_role as string) || ''
    const auditorStatus = formValues.auditor_status as string | undefined

    const fullData: CreateOnboardingInput = {
      companyName: (formValues.company_name as string) || '',
      domains: (formValues.company_domains as string[]) || [],
      companyDetails: {
        size: (formValues.company_size as string) || '',
        sector,
      },
      userDetails: {
        role,
        department: (formValues.user_department as string) || '',
      },
      compliance: {
        frameworks: (formValues.frameworks as string[]) || [],
        other_framework_description: (formValues.other_framework_description as string) || undefined,
        existing_controls: formValues.has_existing_controls as boolean | undefined,
        existing_policies_procedures: formValues.has_existing_policies as boolean | undefined,
        has_auditor: auditorStatus === 'yes',
        recommend_auditors: auditorStatus === 'recommendations',
        auditor_name: auditorStatus === 'yes' ? (formValues.auditor_name as string) || undefined : undefined,
        auditor_email: auditorStatus === 'yes' ? (formValues.auditor_email as string) || undefined : undefined,
        recommend_vciso_partner: formValues.vciso_preference === 'connect_vciso_partner',
      },
      demoRequested: (formValues.demo_requested as boolean) ?? false,
    }

    const response = await createOnboarding({
      input: fullData,
    })

    if (!response?.createOnboarding) {
      throw new Error('Unexpected response format')
    }

    const orgId = response.createOnboarding.onboarding.organizationID
    if (!orgId) return null

    // Persist the selected frameworks as Standard.shortName values (e.g. "SOC 2") so the
    // standards catalog can surface them as recommended -- the onboarding response itself
    // isn't queryable after this mutation, so the client is the only place to carry it forward
    const frameworksQuestion = questionSteps
      .flatMap((step) => [...(step.questions ?? []), ...(step.sections?.flatMap((section) => section.questions) ?? [])])
      .find((question) => question.key === 'frameworks')
    const selectedFrameworkValues = (formValues.frameworks as string[]) || []
    const selectedFrameworkLabels = selectedFrameworkValues.map((value) => frameworksQuestion?.options?.find((option) => option.value === value)?.label).filter((label): label is string => !!label)
    setOnboardingFrameworks(selectedFrameworkLabels, orgId)

    const switchResponse = await switchOrganization({
      target_organization_id: orgId,
    })

    if (handleSSORedirect(switchResponse)) {
      return 'sso-redirect' as const
    }

    if (!sessionData || !switchResponse) return null

    // Reconnect the websocket with the new org's token right away, rather than waiting for
    // useSession() to re-render with it -- otherwise a notification published in that gap
    // (e.g. the domain scan finishing) would go to a socket still scoped to the old org
    if (switchResponse.access_token) {
      setPendingToken(switchResponse.access_token)
    }

    // Keep isOnboarding true until the "ready" screen (post domain-scan-wait) is shown,
    // otherwise the sidebar nav pops in as soon as this submit resolves
    await updateSession({
      ...switchResponse.session,
      user: {
        ...sessionData.user,
        accessToken: switchResponse.access_token,
        activeOrganizationId: orgId,
        refreshToken: switchResponse.refresh_token,
      },
    })

    requestAnimationFrame(() => {
      queryClient?.clear()
    })

    return 'success' as const
  }

  const onSubmit = async (data?: Record<string, unknown>) => {
    setSubmitStage('transition')
    setWorkspaceReady(false)
    setDomainScanWaitOver(false)
    const formValues = data ?? methods.getValues()

    try {
      const result = await performOnboarding(formValues)

      if (result === 'sso-redirect' || result === null) {
        return
      }

      setWorkspaceReady(true)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
      setSubmitStage('form')
    }
  }

  const handleExitOnboarding = () =>
    methods.handleSubmit(async (data) => {
      try {
        const result = await performOnboarding(data)

        if (result === 'sso-redirect' || result === null) {
          return
        }

        // exiting skips the transition/ready screens (and the effect that clears isOnboarding
        // once they're reached), so clear it here -- otherwise the sidebar nav stays hidden.
        // Only the changed field is sent: the jwt callback's `update` trigger shallow-merges
        // `session.user` onto the token, so spreading the (stale, pre-org-switch) sessionData.user
        // here would clobber the accessToken/activeOrganizationId performOnboarding just set
        await updateSession({ user: { isOnboarding: false } })

        router.push('/')
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    })()

  // shared by every "leave onboarding early" button (Explore Openlane, Do this later,
  // Go to dashboard). The 'ready'-stage effect below also clears isOnboarding, but it's a
  // fire-and-forget updateSession() -- clicking fast enough (or a slow round trip) can
  // still race the '/' navigation and get bounced back to /onboarding by the middleware.
  // Awaiting it here directly, like handleExitOnboarding does, removes that race.
  const handleLeaveOnboarding = async () => {
    await updateSession({ user: { isOnboarding: false } })
    router.push('/')
  }

  const currentStep = questionSteps.find((step) => step.key === stepper.state.current.data.id)

  const handleNext = async () => {
    const requiredKeys = currentStep ? getRequiredKeysForStep(currentStep) : []
    const isValid = requiredKeys.length > 0 ? await methods.trigger(requiredKeys) : true

    if (!isValid) return

    if (!stepper.state.isLast) {
      stepper.navigation.next()
    } else {
      methods.handleSubmit((data) => onSubmit(data))()
    }
  }

  const handleBack = () => {
    if (!stepper.state.isFirst) {
      stepper.navigation.prev()
    }
  }

  const currentIndex = stepper.state.all.findIndex((item) => item.id === stepper.state.current.data.id)
  const isLastStep = stepper.state.isLast
  const isFirstStep = stepper.state.isFirst
  const hasFormErrors = Object.keys(methods.formState.errors).length > 0
  const isCurrentStepIncomplete = (currentStep ? getRequiredKeysForStep(currentStep) : []).some((key) => {
    const value = values[key]
    return Array.isArray(value) ? value.length === 0 : !value
  })
  const isNextDisabled = hasFormErrors || isCurrentStepIncomplete
  const domains = values.company_domains as string[] | undefined
  const primaryDomain = domains?.[0]
  const stats = domainScanStats(domainScanNotification?.data)

  return (
    <div className={`flex flex-col w-full max-w-6xl m-auto px-4 py-8 ${submitStage === 'form' ? 'pb-28' : ''}`}>
      <div className="flex flex-col lg:flex-row w-full gap-10">
        <div className={`hidden lg:flex flex-col gap-8 self-start ${CONTENT_LEFT_COLUMN_CLASS}`}>
          <Logo width={150} height={24} />

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold">Welcome to Openlane</h1>
            <p className="text-sm text-muted-foreground">Let&apos;s set up your workspace so you can get value faster</p>
          </div>

          <SetupProgressCard currentIndex={currentIndex} stage={submitStage} />
        </div>

        <div className={`flex flex-col ${CONTENT_RIGHT_COLUMN_CLASS}`}>
          {submitStage === 'transition' && (
            <Card className="w-full min-h-96 p-7 md:p-8 shadow-lg rounded-xl">
              <div className="flex flex-col gap-3 mb-8">
                <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
                  Step {steps.length} of {steps.length}
                </Badge>
                <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-xl font-semibold">{trialTitle}</h2>
                <p className="text-sm text-text-light">
                  {trialDescription.split('{{domain}}').map((part, index, parts) => (
                    <Fragment key={index}>
                      {part}
                      {index < parts.length - 1 && <span className="font-mono text-xs">{primaryDomain || 'your domain'}</span>}
                    </Fragment>
                  ))}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Included in your trial</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {trialCards.map(({ key, title, description }) => {
                    const Icon = TRIAL_CARD_ICONS[key] ?? Sparkles
                    return (
                      <div key={key} className="flex flex-col gap-2 rounded-md border border-border p-4">
                        <Icon className="text-primary" size={20} />
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-text-light">{description}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-text-light">Free 30-day trial, no credit card required. You do not need to stay on this page while we finish.</p>
              </div>

              <Button className="w-full mt-6" type="button" icon={<ArrowRight />} onClick={handleLeaveOnboarding}>
                Explore Openlane, don&apos;t wait
              </Button>
            </Card>
          )}

          {submitStage === 'ready' && (
            <Card className="w-full min-h-96 p-7 md:p-8 shadow-lg rounded-xl">
              <div className="flex flex-col gap-3 mb-8 w-full">
                <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
                  Step {steps.length} of {steps.length}
                </Badge>
                <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {domainScanNotification ? (
                <>
                  <div className="space-y-2 mb-6">
                    <h2 className="text-xl font-semibold">Your setup is ready</h2>
                    <p className="text-sm text-text-light">
                      We found systems, vendors, assets, and security findings for {primaryDomain || 'your domain'}. Review and edit each section before adding it to Openlane.
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-semibold mb-3">What we found</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Server, count: stats.systems, label: 'systems' },
                        { icon: Box, count: stats.assets, label: 'assets' },
                        { icon: Users, count: stats.vendors, label: 'vendors' },
                        { icon: ShieldAlert, count: stats.findings, label: 'findings' },
                      ].map(({ icon: Icon, count, label }) => (
                        <div key={label} className="flex items-center gap-3 rounded-md border border-border p-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon size={18} />
                          </span>
                          <div className="flex flex-col">
                            <span className="text-lg font-semibold leading-none">{count}</span>
                            <span className="text-xs text-text-light">{label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" type="button" icon={<ArrowRight />} onClick={reviewDomainScanFindings}>
                    Review what we found
                  </Button>
                  <button type="button" className="text-sm text-text-light mt-3 bg-transparent w-full text-center" onClick={handleLeaveOnboarding}>
                    Do this later
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-2 mb-6">
                    <h2 className="text-xl font-semibold">Your setup is ready</h2>
                    <p className="text-sm text-text-light">We&apos;ll keep scanning in the background and notify you when your results are ready.</p>
                  </div>

                  <Button className="w-full" type="button" icon={<ArrowRight />} onClick={handleLeaveOnboarding}>
                    Go to dashboard
                  </Button>
                </>
              )}
            </Card>
          )}

          {submitStage === 'form' && currentStep && (
            <FormProvider {...methods}>
              <form className="w-full" onSubmit={methods.handleSubmit((data) => onSubmit(data))}>
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
          <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur" style={{ marginLeft: contentOffset.marginLeft, marginRight: contentOffset.marginRight }}>
            <div className="flex w-full max-w-6xl mx-auto gap-10 px-4 py-4">
              <div className={`hidden lg:block relative ${CONTENT_LEFT_COLUMN_CLASS}`}>
                {currentIndex > 0 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-sm" onClick={handleExitOnboarding}>
                    <span className="text-blue-500 cursor-pointer">Exit the onboarding process</span> <span> and use general template for my account.</span>
                  </div>
                )}
              </div>
              <div className={`flex items-center justify-between gap-10 ${CONTENT_RIGHT_COLUMN_CLASS}`}>
                <div className="lg:hidden text-sm" onClick={handleExitOnboarding}>
                  {currentIndex > 0 && (
                    <>
                      <span className="text-blue-500 cursor-pointer">Exit the onboarding process</span> <span> and use general template for my account.</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  {!isFirstStep && (
                    <Button type="button" onClick={handleBack} variant="secondary" icon={<ArrowLeft />} iconPosition="left">
                      {steps[currentIndex - 1]?.label}
                    </Button>
                  )}
                  <Button className="self-end" type="button" onClick={handleNext} icon={<ArrowRight />} disabled={isNextDisabled}>
                    {isLastStep ? 'Submit' : steps[currentIndex + 1]?.label}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
