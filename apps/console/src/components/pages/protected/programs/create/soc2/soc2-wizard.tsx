'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import { defineStepper } from '@stepperize/react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/program'
import { useCloneControls, useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Separator } from '@repo/ui/separator'
import { addYears, getYear } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import SelectCategoryStep from '../shared/steps/select-category-step'
import StartTypeStep from '../shared/steps/start-type-step'
import TeamSetupStep from '../shared/steps/team-setup-step'
import { fullSchema, suggestedControlsStepSchema, validateFullAndNotify, type WizardValues } from './soc2-wizard-config'
import SuggestedControlsStep from './suggested-controls-step'

const today = new Date()
const oneYearFromToday = addYears(today, 1)
const currentYear = getYear(today)

export default function Soc2Wizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const includeSuggestedControls = searchParams.get('suggestedControls') === 'true'
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const { mutateAsync: cloneControls, isPending: isControlBeingCloned } = useCloneControls()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { data } = useStandardsSelect({ where: { shortName: 'SOC 2' } })
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const standardID = data?.standards?.edges?.[0]?.node?.id

  const { useStepper } = defineStepper(
    { id: '0', label: 'Pick Categories', schema: fullSchema.pick({ categories: true, standardID: true }) },
    ...(includeSuggestedControls ? [{ id: '1', label: 'Import Controls', schema: suggestedControlsStepSchema }] : []),
    { id: '2', label: 'Team Setup', schema: fullSchema.pick({ programAdmins: true, programMembers: true, viewerIDs: true, editorIDs: true }) },
    { id: '3', label: 'Access Control', schema: fullSchema.pick({ programKindName: true }) },
  )
  const stepper = useStepper()

  const methods = useForm<WizardValues>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange',
    defaultValues: {
      categories: includeSuggestedControls ? ['Security', 'Availability'] : ['Security'],
      suggestedControlIDs: [],
    },
  })

  const programKindName = useWatch({ control: methods.control, name: 'programKindName' })
  const isCreationDisabled = stepper.isLast && !programKindName

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
        programKindName: data.programKindName,
        startDate: today,
        endDate: oneYearFromToday,
        viewerIDs: data.viewerIDs,
        editorIDs: data.editorIDs,
        frameworkName: 'SOC 2',
      },
      standardID,
      categories: data.categories,
      members: [...programMembers, ...programAdmins],
    }

    try {
      const resp = await createProgram({ input })
      const programID = resp.createProgramWithMembers.program.id

      // clone the selected controls in the program
      if (includeSuggestedControls && data.suggestedControlIDs?.length) {
        await cloneControls({
          input: {
            programID,
            controlIDs: data.suggestedControlIDs,
          },
        })
      }

      successNotification({
        title: 'Program Created',
        description: `Your program has been successfully created`,
      })
      router.push(`/programs/${programID}`)
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
    if (!stepper.isLast) {
      let isValid: boolean
      if (stepper.current.id === '0') {
        isValid = await methods.trigger(['categories', 'standardID'])
      } else if (stepper.current.id === '1') {
        isValid = await methods.trigger('suggestedControlIDs')
      } else {
        isValid = await methods.trigger(['programAdmins', 'programMembers', 'viewerIDs', 'editorIDs'])
      }

      if (!isValid) return
      stepper.next()
    } else {
      const validAll = await validateFullAndNotify(methods, errorNotification)
      if (!validAll) return

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
      { label: 'Compliance', href: '/programs' },
      { label: 'Programs', href: '/programs' },
      { label: 'Create', href: '/programs/create' },
      { label: 'SOC2', href: '/programs/create/soc2' },
    ])
  }, [setCrumbs])

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} className="mb-6" />
        <Separator separatorClass="bg-card" />
        <FormProvider {...methods}>
          <form onSubmit={handleNext}>
            <div className="py-6">
              {stepper.switch({
                0: () => <SelectCategoryStep />,
                1: () => <SuggestedControlsStep standardID={standardID} />,
                2: () => <TeamSetupStep />,
                3: () => <StartTypeStep />,
              })}
              <div className="flex justify-between mt-8">
                <Button type="button" variant="secondary" onClick={handleBack} iconPosition="left">
                  Back
                </Button>
                <Button variant="primary" type="button" onClick={() => handleNext()} disabled={isPending || isControlBeingCloned || isCreationDisabled} loading={isPending || isControlBeingCloned}>
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
