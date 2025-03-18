'use client'
import React, { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { defineStepper } from '@stepperize/react'
import { useSession } from 'next-auth/react'
import { CreateOnboardingInput } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { ArrowRight, ArrowLeft, PartyPopper, Wind, WindIcon } from 'lucide-react'
import Step1, { step1Schema } from '@/components/pages/protected/onboarding/step-1'
import Step2, { step2Schema } from '@/components/pages/protected/onboarding/step-2'
import Step3, { step3Schema } from '@/components/pages/protected/onboarding/step-3'
import { useRef } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useRouter } from 'next/navigation'
import { switchOrganization } from '@/lib/user'
import { useCreateOnboarding } from '@/lib/graphql-hooks/onboarding'

const { useStepper, steps } = defineStepper(
  { id: '0', label: `Company Info`, schema: step1Schema },
  { id: '1', label: `User Info`, schema: step2Schema },
  { id: '2', label: `Compliance Info`, schema: step3Schema },
)

export default function MultiStepForm() {
  const stepper = useStepper()
  const { mutateAsync: createOnboarding } = useCreateOnboarding()
  const router = useRouter()
  const { data: sessionData, update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { successNotification, errorNotification } = useNotification()

  const formDataRef = useRef<Partial<CreateOnboardingInput>>({
    companyName: '',
    domains: [],
    companyDetails: {},
    userDetails: {},
    compliance: {},
    organizationID: undefined,
  })

  const methods = useForm<CreateOnboardingInput>({
    resolver: zodResolver(stepper.current.schema),
    defaultValues: formDataRef.current,
    mode: 'onChange',
  })

  const onSubmit = async () => {
    setIsLoading(true)
    try {
      if (formDataRef.current.companyDetails.sector === 'Other (Please Specify)') {
        formDataRef.current.companyDetails.sector = formDataRef.current.companyDetails.otherSector || ''
        formDataRef.current.companyDetails.otherSector = undefined
      }

      const fullData: CreateOnboardingInput = {
        companyName: formDataRef.current.companyName || '',
        domains: formDataRef.current.domains || [],
        companyDetails: formDataRef.current.companyDetails || {},
        userDetails: formDataRef.current.userDetails || {},
        compliance: formDataRef.current.compliance || {},
      }

      const response = await createOnboarding({
        input: fullData,
      })

      if (response?.createOnboarding) {
        successNotification({
          title: 'Onboarding completed successfully.!',
        })
      } else {
        throw new Error('Unexpected response format')
      }

      const orgId = response?.createOnboarding.onboarding.organizationID

      if (orgId) {
        const response = await switchOrganization({
          target_organization_id: orgId,
        })

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
          router.push('/dashboard')
        }
      }
    } catch (err) {
      errorNotification({
        title: 'There was an error while submitting the form. Please try again.',
      })
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    const isValid = await methods.trigger()
    if (!isValid) return

    formDataRef.current = { ...formDataRef.current, ...methods.getValues() }

    if (!stepper.isLast) {
      stepper.next()
    } else {
      methods.handleSubmit(() => onSubmit())()
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

  return (
    <div className="flex justify-center flex-col items-center max-w-[545px] m-auto">
      <div>
        <h1 className="text-2xl py-3">Welcome to Openlane 🙇‍♀️</h1>
        <p className="text-sm pb-5">We are glad to have you! Let's get started with a few questions.</p>
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
          <form className="w-full" onSubmit={methods.handleSubmit(onSubmit)}>
            <Card className="bg-transparent">
              <p className="text-center p-2">{`Let’s get you started (${currentIndex + 1}/${steps.length})`}</p>
              <div className="relative bg-progressbar h-1 w-full">
                <div className={`absolute bg-brand h-1`} style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}></div>
              </div>
              <div className="p-7 bg-secondary">
                {stepper.switch({
                  0: () => <Step1 />,
                  1: () => <Step2 />,
                  2: () => <Step3 />,
                })}
                <div className="flex justify-between mt-6">
                  {!isFirstStep ? (
                    <Button type="button" onClick={handleBack} variant="outline" icon={<ArrowLeft />} iconPosition="left">
                      {steps[currentIndex - 1]?.label}
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button className="self-end" type="button" onClick={handleNext} icon={<ArrowRight />}>
                    {isLastStep ? 'Submit' : steps[currentIndex + 1]?.label}
                  </Button>
                </div>
                {currentIndex === 1 && (
                  <div className="border-t pt-5 mt-5 text-sm" onClick={methods.handleSubmit(onSubmit)}>
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
