'use client'

import { COMPLIANCE_FRAMEWORKS, ONBOARDING_PROGRAM_ROUTES } from '@/components/pages/protected/onboarding/constants'
import Step1, { step1Schema } from '@/components/pages/protected/onboarding/step-1'
import Step2, { step2Schema } from '@/components/pages/protected/onboarding/step-2'
import Step3, { step3Schema } from '@/components/pages/protected/onboarding/step-3'
import Step4, { step4Schema } from '@/components/pages/protected/onboarding/step-4'
import { useNotification } from '@/hooks/useNotification'
import { useCreateOnboarding } from '@/lib/graphql-hooks/onboarding'
import { handleSSORedirect, switchOrganization } from '@/lib/user'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { zodResolver } from '@hookform/resolvers/zod'
import { type CreateOnboardingInput } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { defineStepper } from '@stepperize/react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, PartyPopper, WindIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { type DefaultValues, FormProvider, useForm, useWatch } from 'react-hook-form'
import { type z } from 'zod'

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
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { successNotification, errorNotification } = useNotification()

  const methods = useForm<OnboardingFormInput, undefined, OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: 'onChange',
  })
  const companyName = useWatch({ control: methods.control, name: 'companyName' })
  const domains = useWatch({ control: methods.control, name: 'domains' })
  const companySize = useWatch({ control: methods.control, name: 'companyDetails.size' })
  const companySector = useWatch({ control: methods.control, name: 'companyDetails.sector' })
  const userRole = useWatch({ control: methods.control, name: 'userDetails.role' })
  const userDepartment = useWatch({ control: methods.control, name: 'userDetails.department' })
  const frameworks = useWatch({ control: methods.control, name: 'compliance.frameworks' })
  const controlsDocumented = useWatch({ control: methods.control, name: 'compliance.controls_documented' })
  const policiesDocumented = useWatch({ control: methods.control, name: 'compliance.policies_documented' })
  const hasAuditor = useWatch({ control: methods.control, name: 'compliance.has_auditor' })
  const recommendAuditors = useWatch({ control: methods.control, name: 'compliance.recommend_auditors' })
  const hasVcisoPartner = useWatch({ control: methods.control, name: 'compliance.has_vciso_partner' })
  const recommendVcisoPartner = useWatch({ control: methods.control, name: 'compliance.recommend_vciso_partner' })
  const demoRequested = useWatch({ control: methods.control, name: 'demo_requested' })

  const onSubmit = async (data?: OnboardingFormInput | OnboardingFormData) => {
    setIsLoading(true)
    try {
      const formValues = data ?? methods.getValues()
      const companyDetails = { ...(formValues.companyDetails || {}) }

      if (companyDetails.sector === 'Other (Please Specify)') {
        companyDetails.sector = companyDetails.otherSector || ''
        companyDetails.otherSector = undefined
      }

      const fullData: CreateOnboardingInput = {
        companyName: formValues.companyName || '',
        domains: formValues.domains || [],
        companyDetails,
        userDetails: formValues.userDetails || {},
        compliance: formValues.compliance || {},
        demoRequested: formValues.demo_requested ?? false,
      }

      const response = await createOnboarding({
        input: fullData,
      })

      if (response?.createOnboarding) {
        successNotification({
          title: 'Onboarding completed successfully',
        })
      } else {
        throw new Error('Unexpected response format')
      }

      const orgId = response?.createOnboarding.onboarding.organizationID

      if (orgId) {
        const response = await switchOrganization({
          target_organization_id: orgId,
        })

        if (handleSSORedirect(response)) {
          return
        }

        if (sessionData && response) {
          await updateSession({
            ...response.session,
            user: {
              ...sessionData.user,
              accessToken: response.access_token,
              activeOrganizationId: orgId,
              refreshToken: response.refresh_token,
              isOnboarding: false,
            },
          })

          requestAnimationFrame(() => {
            queryClient?.clear()
          })

          const userSelectedFrameworks = (formValues.compliance?.frameworks ?? []).filter((framework) => framework !== COMPLIANCE_FRAMEWORKS.other)

          if (userSelectedFrameworks.length > 1) {
            const params = new URLSearchParams()
            userSelectedFrameworks.forEach((framework) => params.append('frameworks', framework))
            if (!formValues.compliance?.controls_documented) {
              params.set('suggestedControls', 'true')
            }
            router.push(`${ONBOARDING_PROGRAM_ROUTES.advancedSetup}?${params.toString()}`)
            return
          }

          const selectedFramework = userSelectedFrameworks[0]

          if (selectedFramework === COMPLIANCE_FRAMEWORKS.soc2) {
            const params = new URLSearchParams()
            if (!formValues.compliance?.controls_documented) {
              params.set('suggestedControls', 'true')
            }

            router.push(`${ONBOARDING_PROGRAM_ROUTES.soc2}${params.size ? `?${params.toString()}` : ''}`)
            return
          }

          if (selectedFramework) {
            const params = new URLSearchParams({ framework: selectedFramework })
            if (!formValues.compliance?.controls_documented) {
              params.set('suggestedControls', 'true')
            }
            router.push(`${ONBOARDING_PROGRAM_ROUTES.frameworkBased}?${params.toString()}`)
            return
          }

          router.push(ONBOARDING_PROGRAM_ROUTES.frameworkBased)
        }
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    let isValid: boolean

    if (stepper.current.id === '0') {
      isValid = await methods.trigger(['companyName', 'domains', 'companyDetails.size', 'companyDetails.sector'])
    } else if (stepper.current.id === '1') {
      isValid = await methods.trigger(['userDetails.role', 'userDetails.department'])
    } else if (stepper.current.id === '2') {
      isValid = await methods.trigger(['compliance.frameworks', 'compliance.controls_documented', 'compliance.policies_documented'])
    } else {
      isValid = await methods.trigger(['compliance.has_auditor', 'compliance.recommend_auditors', 'compliance.has_vciso_partner', 'compliance.recommend_vciso_partner', 'demo_requested'])
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
  const isCurrentStepIncomplete =
    (stepper.current.id === '0' && (!companyName || companyName.length < 3 || !domains?.length || !companySize || !companySector)) ||
    (stepper.current.id === '1' && (!userRole || !userDepartment)) ||
    (stepper.current.id === '2' && (!frameworks?.length || controlsDocumented === undefined || policiesDocumented === undefined)) ||
    (stepper.current.id === '3' && (hasAuditor === undefined || recommendAuditors === undefined || hasVcisoPartner === undefined || recommendVcisoPartner === undefined || demoRequested === undefined))
  const isNextDisabled = hasFormErrors || isCurrentStepIncomplete

  return (
    <div className="flex justify-center flex-col items-center max-w-[545px] m-auto">
      <div className="self-start w-full">
        <h1 className="text-2xl py-3 font-medium text-left">Welcome to Openlane</h1>
        <p className="text-sm font-normal pb-5 text-left">We are glad to have you! Let&apos;s get started with a few questions.</p>
      </div>
      {isLoading && isLastStep && (
        <Card className="p-7 flex flex-col gap-2 items-center w-full">
          <PartyPopper size={89} strokeWidth="1" />
          <p className="text-sm">Thank you for all your answers. We are now preparing your account.</p>
          <p className="text-sm">Please wait ...</p>
        </Card>
      )}

      {isLoading && !isLastStep && (
        <Card className="p-7 flex flex-col gap-2 items-center w-full">
          <WindIcon size={89} strokeWidth="1" />
          <p className="text-sm">We understand that you’re in hurry and want jump into action.</p>
          <p className="text-sm">We are now preparing your account ...</p>
        </Card>
      )}

      {!isLoading && (
        <FormProvider {...methods}>
          <form className="w-full" onSubmit={methods.handleSubmit((data) => onSubmit(data))}>
            <Card className="bg-transparent">
              <p className="text-center p-2">{`Let’s get you started (${currentIndex + 1}/${steps.length})`}</p>
              <div className="relative bg-progressbar h-1 w-full">
                <div className={`absolute bg-brand h-1`} style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}></div>
              </div>
              <div className="p-7 bg-secondary rounded-b-lg">
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
                {currentIndex === 1 && (
                  <div className="border-t pt-5 mt-5 text-sm" onClick={methods.handleSubmit((data) => onSubmit(data))}>
                    <span className="text-blue-500 cursor-pointer">Exit the onboarding process</span> <span> and use general template for my account.</span>
                  </div>
                )}
              </div>
            </Card>
          </form>
        </FormProvider>
      )}
    </div>
  )
}
