'use client'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'

import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import TeamSetupStep from '../shared/steps/team-setup-step'
import SelectFrameworkStep from '../shared/steps/select-framework-step'
import { programInviteSchema, selectFrameworkSchema, step3Schema, wizardSchema, WizardValues } from './risk-assessment-wizard-config'
import AssociateRisksStep from './associate-risk-step'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/program'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears, getYear } from 'date-fns'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

const today = new Date()
const oneYearFromToday = addYears(today, 1)
const currentYear = getYear(today)

export default function RiskAssessmentWizard() {
  const router = useRouter()
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [showExitConfirm, setShowExitConfirm] = useState(false) // ✅ new state

  const { useStepper } = defineStepper(
    { id: '0', label: 'Pick Categories', schema: selectFrameworkSchema },
    { id: '1', label: 'Team Setup', schema: programInviteSchema },
    { id: '2', label: 'Access Control', schema: step3Schema },
  )

  const stepper = useStepper()

  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      framework: '',
      programMembers: [],
      programAdmins: [],
      riskIDs: [],
      programKindName: 'Risk Assessment',
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
        programKindName: values.programKindName,
        startDate: today,
        endDate: oneYearFromToday,
        viewerIDs: values.viewerIDs,
        editorIDs: values.editorIDs,
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
      router.push(`/programs/${resp.createProgramWithMembers.program.id}`)
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
      setShowExitConfirm(true)
    } else {
      stepper.prev()
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance' },
      { label: 'Programs', href: '/programs' },
      { label: 'Create', href: '/programs/create' },
      { label: 'Risk Assessment', href: '/programs/create/risk-assessment' },
    ])
  }, [setCrumbs])

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} />
        <Separator separatorClass="bg-card" />
        <FormProvider {...methods}>
          <form onSubmit={handleNext}>
            <div className="py-6">
              {stepper.switch({
                0: () => <SelectFrameworkStep />,
                1: () => <TeamSetupStep />,
                2: () => <AssociateRisksStep />,
              })}
              <div className="flex justify-between mt-8">
                <Button type="button" variant="secondary" onClick={handleBack} iconPosition="left">
                  Back
                </Button>
                <Button variant="primary" type="button" onClick={() => handleNext()} disabled={isPending} loading={isPending}>
                  {stepper.isLast ? 'Create' : 'Continue'}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>

      <ConfirmationDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        onConfirm={() => router.push('/programs/create')}
        title="Exit Program Creation"
        description="Are you sure you want to exit Program Creation? You can't undo this."
        confirmationText="Exit"
      />
    </>
  )
}
