'use client'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import SOC2CategoryStep from './soc2-category-step'
import TeamSetupStep from '../shared/steps/team-setup-step'
import StartTypeStep from '../shared/steps/start-type-step'
import { programInviteSchema, step1Schema, step3Schema, validateFullAndNotify, validateStepAndNotify, WizardValues } from './sco2-wizard-config'
import { useNotification } from '@/hooks/useNotification'
import { CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/programs'
import { getYear } from 'date-fns'

const currentYear = getYear(new Date())

export default function Soc2Wizard() {
  const router = useRouter()
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()

  const { useStepper } = defineStepper(
    { id: '0', label: 'Pick Categories', schema: step1Schema },
    { id: '1', label: 'Team Setup', schema: programInviteSchema },
    { id: '2', label: 'Access Control', schema: step3Schema },
  )
  const stepper = useStepper()

  const methods = useForm<WizardValues>({
    resolver: zodResolver(stepper.current.schema),
    mode: 'onChange',
    defaultValues: {
      categories: [],
      programType: undefined,
    },
  })

  const handleSubmit = async () => {
    const data = methods.getValues()

    const programMembers =
      data.programMembers?.map((userId) => ({
        userID: userId,
        role: ProgramMembershipRole.MEMBER,
      })) ?? []

    const programAdmins =
      data.programAdmins?.map((userId) => ({
        userID: userId,
        role: ProgramMembershipRole.ADMIN,
      })) ?? []

    const input: CreateProgramWithMembersInput = {
      program: {
        name: `SOC2 - ${currentYear}`,
        programType: data.programType,
      },
      categories: data.categories,
      members: [...programMembers, ...programAdmins],
    }

    try {
      const resp = await createProgram({ input })
      successNotification({
        title: 'Program Created',
        description: `Your program has been successfully created`,
      })
      router.push(`/programs?id=${resp.createProgramWithMembers.program.id}`)
    } catch (e) {
      const errorMessage = parseErrorMessage(e)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleNext = async () => {
    if (!stepper.isLast) {
      const valid = await validateStepAndNotify(methods, stepper.current.id, errorNotification)
      if (!valid) return
      stepper.next()
    } else {
      const validAll = await validateFullAndNotify(methods, errorNotification)
      if (!validAll) return

      await handleSubmit()
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
    <div className="max-w-3xl mx-auto px-6 py-2">
      <StepHeader stepper={stepper} currentIndex={currentIndex} />
      <Separator className="" separatorClass="bg-card" />
      <FormProvider {...methods}>
        <div className="py-6">
          {stepper.switch({
            0: () => <SOC2CategoryStep />,
            1: () => <TeamSetupStep />,
            2: () => <StartTypeStep />,
          })}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack} iconPosition="left">
              Back
            </Button>
            <Button onClick={handleNext} disabled={isPending} loading={isPending}>
              {stepper.isLast ? 'Create' : 'Continue'}
            </Button>
          </div>
        </div>
      </FormProvider>
    </div>
  )
}
