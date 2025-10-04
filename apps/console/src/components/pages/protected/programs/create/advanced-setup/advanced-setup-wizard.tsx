'use client'

import React, { useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import AdvancedSetupStep1 from './advanced-setup-steps/advanced-setup-step1'
import AdvancedSetupStep2 from './advanced-setup-steps/advanced-setup-step2'
import AdvancedSetupStep3 from './advanced-setup-steps/advanced-setup-step3'
import AdvancedSetupStep4 from './advanced-setup-steps/advanced-setup-step4'
import AdvancedSetupStep5 from './advanced-setup-steps/advanced-setup-step5'

export default function AdvancedSetupWizard() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Zod schemas per step (fill in as we build each screen)
  const step1Schema = z.object({}) // Select a Program Type
  const step2Schema = z.object({}) // General Information
  const step3Schema = z.object({}) // Auditors
  const step4Schema = z.object({}) // Add Team Members
  const step5Schema = z.object({}) // Associate Existing Objects

  const { useStepper } = defineStepper(
    { id: '0', label: 'Select a Program Type', schema: step1Schema },
    { id: '1', label: 'General Information', schema: step2Schema },
    { id: '2', label: 'Auditors', schema: step3Schema },
    { id: '3', label: 'Add Team Members', schema: step4Schema },
    { id: '4', label: 'Associate Existing Objects', schema: step5Schema },
  )

  const stepper = useStepper()

  const methods = useForm({
    resolver: zodResolver(stepper.current.schema),
    mode: 'onChange',
  })

  const handleNext = async () => {
    const isValid = await methods.trigger()
    if (!isValid) return

    if (!stepper.isLast) {
      stepper.next()
    } else {
      setIsLoading(true)
      // TODO: final submit handler
    }
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      return router.push('/programs/create')
    }
    stepper.prev()
  }

  const currentIndex = stepper.all.findIndex((item) => item.id === stepper.current.id)

  return (
    <div className="max-w-6xl mx-auto px-6 py-2">
      <StepHeader stepper={stepper} currentIndex={currentIndex} />
      <Separator separatorClass="bg-card" />

      {/* key remounts the form when step changes so the resolver updates */}
      <FormProvider {...methods} key={stepper.current.id}>
        <div className="py-6 flex gap-16">
          <div className="flex flex-col flex-1">
            {stepper.switch({
              0: () => <AdvancedSetupStep1 />,
              1: () => <AdvancedSetupStep2 />,
              2: () => <AdvancedSetupStep3 />,
              3: () => <AdvancedSetupStep4 />,
              4: () => <AdvancedSetupStep5 />,
            })}

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} iconPosition="left">
                Back
              </Button>
              <Button onClick={handleNext} disabled={isLoading}>
                {stepper.isLast ? 'Create' : 'Continue'}
              </Button>
            </div>
          </div>
          {/* Right side — Your Program Summary */}
          <div className="space-y-3 w-[400px] shrink-0">
            <h3 className="text-base font-medium">Your Program</h3>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-1">Basic Information</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span>{'Empty'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Program Name</span>
                  <span>Empty</span>
                </div>
                <div className="flex justify-between">
                  <span>Start Date</span>
                  <span>Empty</span>
                </div>
                <div className="flex justify-between">
                  <span>End Date</span>
                  <span>Empty</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-1">Audit Information</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Audit Partner</span>
                  <span>Empty</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Firm</span>
                  <span>Empty</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Partner Email</span>
                  <span>Empty</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-1">Team</p>
              <p className="text-xs text-muted-foreground">Add team members to this program</p>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-1">Associate Existing Objects</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Associate Existing Risks</span>
                  <span>Empty</span>
                </div>
                <div className="flex justify-between">
                  <span>Associate Existing Policies</span>
                  <span>Empty</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Partner Email</span>
                  <span>Empty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormProvider>
    </div>
  )
}
