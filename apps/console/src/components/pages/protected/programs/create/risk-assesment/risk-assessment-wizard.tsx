'use client'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'

import React from 'react'
import { programInviteSchema } from '../shared/steps/team-setup-step'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { ProgramProgramType } from '@repo/codegen/src/schema'
import TeamSetupStep from '../shared/steps/team-setup-step'
import SelectFrameworkStep from '../shared/steps/select-framework-step'
import { selectFrameworkSchema } from './risk-assessment-wizard-config'
import AssociateRisksStep from './associate-risk-step'

export default function RiskAssessmentWizard() {
  const router = useRouter()

  const step3Schema = z.object({
    programType: z.nativeEnum(ProgramProgramType),
  })

  const { useStepper } = defineStepper(
    { id: '0', label: 'Pick Categories', schema: selectFrameworkSchema },
    { id: '1', label: 'Team Setup', schema: programInviteSchema },
    { id: '2', label: 'Access Control', schema: step3Schema },
  )
  const stepper = useStepper()

  const methods = useForm({
    resolver: zodResolver(stepper.current.schema),
    mode: 'onChange',
  })

  const handleNext = async () => {
    const isValid = await methods.trigger()
    console.log('isValid:', isValid)
    console.log('form values:', methods.getValues())
    console.log('form errors:', methods.formState.errors)
    if (!isValid) return
    if (!stepper.isLast) {
      stepper.next()
    } else {
      // TODO: handle submit
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
    <>
      <div className="max-w-3xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} currentIndex={currentIndex} />
        <Separator className="" separatorClass="bg-card" />
        <FormProvider {...methods}>
          <div className="py-6">
            {stepper.switch({
              0: () => <SelectFrameworkStep />,
              1: () => <TeamSetupStep />,
              2: () => <AssociateRisksStep />,
            })}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} iconPosition="left">
                Back
              </Button>
              <Button onClick={handleNext}>{stepper.isLast ? 'Create' : 'Continue'}</Button>
            </div>
          </div>
        </FormProvider>
      </div>
    </>
  )
}
