'use client'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import TeamSetupStep from '../shared/steps/team-setup-step'
import StartTypeStep from '../shared/steps/start-type-step'
import SelectFrameworkStep from '../shared/steps/select-framework-step'
import { programInviteSchema, programTypeSchema, selectFrameworkSchema, validateFullAndNotify, WizardValues } from './framework-based-wizard-config'
import { ProgramMembershipRole, CreateProgramWithMembersInput } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/programs'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears } from 'date-fns'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

const today = new Date()
const oneYearFromToday = addYears(today, 1)

export default function FrameworkBasedWizard() {
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [showExitConfirm, setShowExitConfirm] = useState(false) // ✅ Added state

  const { useStepper } = defineStepper(
    { id: '0', label: 'Select Framework', schema: selectFrameworkSchema },
    { id: '1', label: 'Team Setup', schema: programInviteSchema },
    { id: '2', label: 'Program Type', schema: programTypeSchema },
  )
  const stepper = useStepper()

  const methods = useForm<WizardValues>({
    resolver: zodResolver(stepper.current.schema),
    mode: 'onChange',
  })

  const handleNext = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (!stepper.isLast) {
      const isValid = await methods.trigger()
      if (!isValid) return
      stepper.next()
    } else {
      const validAll = await validateFullAndNotify(methods, errorNotification)
      if (!validAll) return
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    const values = methods.getValues()
    const currentYear = new Date().getFullYear()

    const toMembers = (ids?: string[], role?: ProgramMembershipRole) => ids?.map((userID) => ({ userID, role })) ?? []

    const input: CreateProgramWithMembersInput = {
      program: {
        name: values.name || `Risk Assessment - ${currentYear}`,
        frameworkName: values.framework,
        programType: values.programType,
        startDate: today,
        endDate: oneYearFromToday,
        viewerIDs: values.viewerIDs,
        editorIDs: values.editorIDs,
      },
      standardID: values.standardID,
      members: [...toMembers(values.programMembers, ProgramMembershipRole.MEMBER), ...toMembers(values.programAdmins, ProgramMembershipRole.ADMIN)],
    }

    try {
      const resp = await createProgram({ input })
      successNotification({
        title: 'Program Created',
        description: `Your program, ${input.program.name}, has been successfully created`,
      })
      router.push(`/programs?id=${resp.createProgramWithMembers.program.id}`)
    } catch (e) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(e),
      })
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
      { label: 'Programs', href: '/programs' },
      { label: 'Create', href: '/programs/create' },
      { label: 'Framework based', href: '/programs/create/framework-based' },
    ])
  }, [setCrumbs])

  const currentIndex = stepper.all.findIndex((i) => i.id === stepper.current.id)

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} currentIndex={currentIndex} />
        <Separator className="" separatorClass="bg-card" />
        <FormProvider {...methods}>
          <form onSubmit={handleNext}>
            <div className="py-6">
              {stepper.switch({
                0: () => <SelectFrameworkStep required />,
                1: () => <TeamSetupStep />,
                2: () => <StartTypeStep />,
              })}
              <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={handleBack} iconPosition="left">
                  Back
                </Button>
                <Button type="button" className="btn-secondary" onClick={() => handleNext()} disabled={isPending} loading={isPending}>
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
