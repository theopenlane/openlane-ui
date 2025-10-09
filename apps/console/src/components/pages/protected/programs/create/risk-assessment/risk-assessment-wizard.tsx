'use client'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { CreateProgramWithMembersInput, ProgramMembershipRole, ProgramProgramType } from '@repo/codegen/src/schema'
import TeamSetupStep from '../shared/steps/team-setup-step'
import SelectFrameworkStep from '../shared/steps/select-framework-step'
import { programInviteSchema, selectFrameworkSchema, step3Schema, wizardSchema, WizardValues } from './risk-assessment-wizard-config'
import AssociateRisksStep from './associate-risk-step'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/programs'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears, getYear } from 'date-fns'

const today = new Date()
const oneYearFromToday = addYears(today, 1)
const currentYear = getYear(today)

export default function RiskAssessmentWizard() {
  const router = useRouter()
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()

  const { useStepper } = defineStepper(
    { id: '0', label: 'Pick Categories', schema: selectFrameworkSchema },
    { id: '1', label: 'Team Setup', schema: programInviteSchema },
    { id: '2', label: 'Access Control', schema: step3Schema },
  )

  const stepper = useStepper()
  const currentIndex = stepper.all.findIndex((item) => item.id === stepper.current.id)

  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      framework: '',
      programMembers: [],
      programAdmins: [],
      riskIDs: [],
      programType: ProgramProgramType.RISK_ASSESSMENT,
    },
  })

  const handleSubmit = async () => {
    const values = methods.getValues()

    const programMembers =
      values.programMembers?.map((userId: string) => ({
        userID: userId,
        role: ProgramMembershipRole.MEMBER,
      })) ?? []

    const programAdmins =
      values.programAdmins?.map((userId: string) => ({
        userID: userId,
        role: ProgramMembershipRole.ADMIN,
      })) ?? []

    const input: CreateProgramWithMembersInput = {
      program: {
        name: values.name || `Risk Assessment - ${currentYear}`,
        riskIDs: values.riskIDs,
        frameworkName: values.framework,
        programType: values.programType,
        startDate: today,
        endDate: oneYearFromToday,
      },
      standardID: values.standardID,
      members: [...programMembers, ...programAdmins],
    }

    try {
      const resp = await createProgram({ input })
      successNotification({
        title: 'Program Created',
        description: `Your program, ${values.name}, has been successfully created`,
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

  const handleNext = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    const isValid = await methods.trigger()
    if (!isValid) return

    if (!stepper.isLast) {
      stepper.next()
    } else {
      await handleSubmit()
    }
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      return router.push('/programs/create')
    }
    stepper.prev()
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} currentIndex={currentIndex} />
        <Separator className="" separatorClass="bg-card" />
        <FormProvider {...methods}>
          <form onSubmit={handleNext}>
            <div className="py-6">
              {stepper.switch({
                0: () => <SelectFrameworkStep />,
                1: () => <TeamSetupStep />,
                2: () => <AssociateRisksStep />,
              })}
              <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={handleBack} iconPosition="left">
                  Back
                </Button>
                <Button type="button" onClick={() => handleNext()} disabled={isPending} loading={isPending}>
                  {stepper.isLast ? 'Create' : 'Continue'}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  )
}
