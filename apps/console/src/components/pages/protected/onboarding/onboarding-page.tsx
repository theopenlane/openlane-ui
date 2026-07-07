'use client'

import { COMPLIANCE_FRAMEWORKS, ONBOARDING_PROGRAM_ROUTES } from '@/components/pages/protected/onboarding/constants'
import Step1, { step1Schema } from '@/components/pages/protected/onboarding/step-1'
import Step2, { step2Schema } from '@/components/pages/protected/onboarding/step-2'
import Step3, { step3Schema } from '@/components/pages/protected/onboarding/step-3'
import Step4, { step4Schema } from '@/components/pages/protected/onboarding/step-4'
import { useDomainScanNotification } from '@/hooks/useDomainScanNotification'
import { useNotification } from '@/hooks/useNotification'
import { useCreateOnboarding } from '@/lib/graphql-hooks/onboarding'
import { setOnboardingImportFlags } from '@/lib/storage/onboarding-import'
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
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Loader2, Radar } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type DefaultValues, FormProvider, useForm, useWatch } from 'react-hook-form'
import { type z } from 'zod'

type SubmitStage = 'form' | 'transition' | 'ready'

const TRANSITION_STEPS = ['Company saved', 'Personalized your workspace', 'Finding the best starting framework', 'Preparing your compliance program...']

const { useStepper, steps } = defineStepper(
  { id: '0', label: `Company Info`, schema: step1Schema },
  { id: '1', label: `User Info`, schema: step2Schema },
  { id: '2', label: `Compliance Setup`, schema: step3Schema },
  { id: '3', label: `Auditor Info`, schema: step4Schema },
)

const onboardingSchema = step1Schema.merge(step2Schema).merge(
  step3Schema.extend({
    compliance: step3Schema.shape.compliance.merge(step4Schema.shape.compliance),
    demo_requested: step4Schema.shape.demo_requested,
  }),
)
type OnboardingFormInput = z.input<typeof onboardingSchema>
type OnboardingFormData = z.output<typeof onboardingSchema>

const defaultOnboardingValues: DefaultValues<OnboardingFormInput> = {
  companyName: '',
  domains: [],
  companyDetails: {
    size: '',
    sector: '',
  },
  userDetails: {
    role: '',
    department: '',
  },
  compliance: {
    frameworks: [],
  },
}

export default function MultiStepForm() {
  const queryClient = useQueryClient()
  const stepper = useStepper()
  const { mutateAsync: createOnboarding } = useCreateOnboarding()
  const router = useRouter()
  const { data: sessionData, update: updateSession } = useSession()
  const [submitStage, setSubmitStage] = useState<SubmitStage>('form')
  const [checklistIndex, setChecklistIndex] = useState(0)
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null)
  const [preSelectItems, setPreSelectItems] = useState<string[]>([])
  const { errorNotification } = useNotification()
  const { domainScanNotification, canReviewDomainScanFindings, reviewDomainScanFindings } = useDomainScanNotification()

  const methods = useForm<OnboardingFormInput, undefined, OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: 'onChange',
  })
  const companyName = useWatch({ control: methods.control, name: 'companyName' })
  const domains = useWatch({ control: methods.control, name: 'domains' })

  useEffect(() => {
    if (submitStage !== 'transition') return

    setChecklistIndex(0)
    const interval = setInterval(() => {
      setChecklistIndex((current) => Math.min(current + 1, TRANSITION_STEPS.length - 1))
    }, 1200)

    return () => clearInterval(interval)
  }, [submitStage])

  const buildRedirect = (formValues: OnboardingFormInput | OnboardingFormData) => {
    const userSelectedFrameworks = (formValues.compliance?.frameworks ?? []).filter((framework) => framework !== COMPLIANCE_FRAMEWORKS.other)
    const shouldImportSuggestedControls = formValues.compliance?.existing_controls === false
    const auditorName = formValues.compliance?.has_auditor ? formValues.compliance?.auditor_name : undefined
    const auditorEmail = formValues.compliance?.has_auditor ? formValues.compliance?.auditor_email : undefined

    const items = [...userSelectedFrameworks]
    if (shouldImportSuggestedControls) items.push('Suggested controls')
    if (formValues.compliance?.existing_policies_procedures === false) items.push('Policy templates')
    if (formValues.compliance?.recommend_auditors) items.push('Auditor recommendations')
    if (formValues.compliance?.recommend_vciso_partner) items.push('vCISO partner recommendations')

    const withAuditorParams = (params: URLSearchParams) => {
      if (auditorName) params.set('auditorName', auditorName)
      if (auditorEmail) params.set('auditorEmail', auditorEmail)
      return params
    }

    if (userSelectedFrameworks.length > 1) {
      const params = new URLSearchParams()
      params.set('onboarding', 'true')
      userSelectedFrameworks.forEach((framework) => params.append('frameworks', framework))
      if (shouldImportSuggestedControls) {
        params.set('suggestedControls', 'true')
      }
      return { target: `${ONBOARDING_PROGRAM_ROUTES.advancedSetup}?${withAuditorParams(params).toString()}`, items }
    }

    const selectedFramework = userSelectedFrameworks[0]

    if (selectedFramework === COMPLIANCE_FRAMEWORKS.soc2) {
      const params = new URLSearchParams()
      params.set('onboarding', 'true')
      if (shouldImportSuggestedControls) {
        params.set('suggestedControls', 'true')
      }
      withAuditorParams(params)
      return { target: `${ONBOARDING_PROGRAM_ROUTES.soc2}${params.size ? `?${params.toString()}` : ''}`, items }
    }

    if (selectedFramework) {
      const params = new URLSearchParams({ framework: selectedFramework, onboarding: 'true' })
      if (shouldImportSuggestedControls) {
        params.set('suggestedControls', 'true')
      }
      return { target: `${ONBOARDING_PROGRAM_ROUTES.frameworkBased}?${withAuditorParams(params).toString()}`, items }
    }

    return { target: `${ONBOARDING_PROGRAM_ROUTES.frameworkBased}?${withAuditorParams(new URLSearchParams({ onboarding: 'true' })).toString()}`, items }
  }

  const performOnboarding = async (formValues: OnboardingFormInput | OnboardingFormData) => {
    const companyDetails = { ...(formValues.companyDetails || {}) }
    const userDetails = { ...(formValues.userDetails || {}) }

    if (companyDetails.sector === 'Other (Please Specify)') {
      companyDetails.sector = companyDetails.otherSector || ''
      companyDetails.otherSector = undefined
    }

    if (userDetails.role === 'Other (Please Specify)') {
      userDetails.role = userDetails.otherRole || ''
      userDetails.otherRole = undefined
    }

    const fullData: CreateOnboardingInput = {
      companyName: formValues.companyName || '',
      domains: formValues.domains || [],
      companyDetails,
      userDetails,
      compliance: formValues.compliance || {},
      demoRequested: formValues.demo_requested ?? false,
    }

    const response = await createOnboarding({
      input: fullData,
    })

    if (!response?.createOnboarding) {
      throw new Error('Unexpected response format')
    }

    const orgId = response.createOnboarding.onboarding.organizationID
    if (!orgId) return null

    setOnboardingImportFlags(orgId, {
      controls: formValues.compliance?.existing_controls === true,
      policies: formValues.compliance?.existing_policies_procedures === true,
    })

    const switchResponse = await switchOrganization({
      target_organization_id: orgId,
    })

    if (handleSSORedirect(switchResponse)) {
      return 'sso-redirect' as const
    }

    if (!sessionData || !switchResponse) return null

    await updateSession({
      ...switchResponse.session,
      user: {
        ...sessionData.user,
        accessToken: switchResponse.access_token,
        activeOrganizationId: orgId,
        refreshToken: switchResponse.refresh_token,
        isOnboarding: false,
      },
    })

    requestAnimationFrame(() => {
      queryClient?.clear()
    })

    return buildRedirect(formValues)
  }

  const onSubmit = async (data?: OnboardingFormInput | OnboardingFormData) => {
    setSubmitStage('transition')
    const formValues = data ?? methods.getValues()

    try {
      const [result] = await Promise.all([performOnboarding(formValues), new Promise((resolve) => setTimeout(resolve, 10000))])

      if (result === 'sso-redirect' || result === null) {
        return
      }

      setPreSelectItems(result.items)
      setRedirectTarget(result.target)
      setSubmitStage('ready')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
      setSubmitStage('form')
    }
  }

  const handleNext = async () => {
    let isValid: boolean

    if (stepper.current.id === '0') {
      isValid = await methods.trigger(['companyName', 'domains'])
    } else {
      isValid = true
    }

    if (!isValid) return

    if (!stepper.isLast) {
      stepper.next()
    } else {
      methods.handleSubmit((data) => onSubmit(data))()
    }
  }

  const handleBack = () => {
    if (!stepper.isFirst) {
      stepper.prev()
    }
  }

  const currentIndex = stepper.all.findIndex((item) => item.id === stepper.current.id)
  const isLastStep = stepper.isLast
  const isFirstStep = stepper.isFirst
  const hasFormErrors = Object.keys(methods.formState.errors).length > 0
  const isCurrentStepIncomplete = stepper.current.id === '0' && (!companyName || companyName.length < 3 || !domains?.length)
  const isNextDisabled = hasFormErrors || isCurrentStepIncomplete

  return (
    <div className="flex flex-col w-full max-w-6xl m-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row w-full gap-10">
        <div className="hidden lg:flex flex-col w-full max-w-sm shrink-0 gap-8 self-start">
          <Logo width={150} height={24} />

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold">Welcome to Openlane</h1>
            <p className="text-sm text-muted-foreground">Let&apos;s set up your workspace so you can get value faster</p>
          </div>

          <div className="flex justify-center">
            <Image src="/images/onboarding-cloud.png" alt="" width={367} height={372} priority className="w-full max-w-sm h-auto rounded-2xl" />
          </div>
        </div>

        <div className="flex flex-col w-full max-w-2xl m-auto">
          {submitStage === 'transition' && (
            <Card className="w-full p-7 md:p-8 shadow-lg rounded-xl">
              <div className="flex flex-col gap-3 mb-8">
                <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
                  Step {steps.length} of {steps.length}
                </Badge>
                <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-xl font-semibold">We&apos;re getting your workspace ready</h2>
                <p className="text-sm text-text-light">This will only take a few seconds.</p>
              </div>

              <div className="flex flex-col">
                {TRANSITION_STEPS.map((label, index) => (
                  <div key={label} className="flex items-center gap-3 py-2">
                    {index < checklistIndex ? (
                      <CheckCircle2 className="text-primary shrink-0" size={20} />
                    ) : index === checklistIndex ? (
                      <Loader2 className="animate-spin text-primary shrink-0" size={20} />
                    ) : (
                      <Circle className="text-border shrink-0" size={20} />
                    )}
                    <span className={`text-sm ${index <= checklistIndex ? 'font-medium' : 'text-text-light'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {submitStage === 'ready' && (
            <Card className="w-full p-7 md:p-8 shadow-lg rounded-xl flex flex-col items-center text-center">
              <div className="flex flex-col gap-3 mb-8 w-full">
                <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
                  Step {steps.length} of {steps.length}
                </Badge>
                <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check size={28} />
              </div>

              <h2 className="text-2xl font-semibold mt-4">You&apos;re all set</h2>
              <p className="text-sm text-text-light max-w-sm mt-1">We&apos;ve personalized Openlane based on your answers.</p>

              {preSelectItems.length > 0 && (
                <div className="w-full text-left mt-6">
                  <p className="text-sm font-semibold mb-2">We&apos;ll pre-select:</p>
                  <ul className="space-y-2">
                    {preSelectItems.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="text-primary shrink-0" size={16} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {domainScanNotification && (
                <div className="w-full text-left mt-6 rounded-lg border border-border bg-accent/20 p-4">
                  <div className="flex items-start gap-3">
                    <Radar className="text-primary shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{domainScanNotification.title || 'Your domain scan is ready'}</p>
                      {domainScanNotification.body && <p className="text-sm text-text-light mt-0.5">{domainScanNotification.body}</p>}
                    </div>
                  </div>
                  <Button className="w-full mt-3" type="button" variant="secondary" disabled={!canReviewDomainScanFindings} onClick={reviewDomainScanFindings}>
                    Review domain scan findings
                  </Button>
                </div>
              )}

              <Button className="w-full mt-6" type="button" icon={<ArrowRight />} onClick={() => redirectTarget && router.push(redirectTarget)}>
                Create my compliance program
              </Button>
              <button type="button" className="text-sm text-text-light mt-3 bg-transparent" onClick={() => router.push('/')}>
                Skip for now
              </button>
            </Card>
          )}

          {submitStage === 'form' && (
            <FormProvider {...methods}>
              <form className="w-full" onSubmit={methods.handleSubmit((data) => onSubmit(data))}>
                <Card className="w-full p-7 md:p-8 shadow-lg rounded-xl">
                  <div className="flex flex-col gap-3 mb-8">
                    <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
                      Step {currentIndex + 1} of {steps.length}
                    </Badge>
                    <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }} />
                    </div>
                  </div>

                  {stepper.switch({
                    0: () => <Step1 />,
                    1: () => <Step2 />,
                    2: () => <Step3 />,
                    3: () => <Step4 />,
                  })}

                  <div className="flex justify-between mt-6">
                    {!isFirstStep ? (
                      <Button type="button" onClick={handleBack} variant="secondary" icon={<ArrowLeft />} iconPosition="left">
                        {steps[currentIndex - 1]?.label}
                      </Button>
                    ) : (
                      <div />
                    )}
                    <Button className="self-end" type="button" onClick={handleNext} icon={<ArrowRight />} disabled={isNextDisabled}>
                      {isLastStep ? 'Submit' : steps[currentIndex + 1]?.label}
                    </Button>
                  </div>
                </Card>
              </form>
            </FormProvider>
          )}
        </div>
      </div>

      {submitStage === 'form' && currentIndex > 0 && (
        <div className="pt-5 mt-5 text-sm text-center" onClick={methods.handleSubmit((data) => onSubmit(data))}>
          <span className="text-blue-500 cursor-pointer">Exit the onboarding process</span> <span> and use general template for my account.</span>
        </div>
      )}
    </div>
  )
}
