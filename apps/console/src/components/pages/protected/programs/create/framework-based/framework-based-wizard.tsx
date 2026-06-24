'use client'
import { defineStepper } from '@stepperize/react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import React, { use, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import TeamSetupStep from '../shared/steps/team-setup-step'
import StartTypeStep from '../shared/steps/start-type-step'
import SelectFrameworkStep from '../shared/steps/select-framework-step'
import { suggestedControlsStepSchema, validateFullAndNotify, wizardSchema, type WizardValues } from './framework-based-wizard-config'
import { ProgramMembershipRole, type CreateProgramWithMembersInput } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/program'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears } from 'date-fns'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import SelectCategoryStep from '../shared/steps/select-category-step'
import SuggestedControlsStep from '../soc2/suggested-controls-step'
import { useCloneControls } from '@/lib/graphql-hooks/standard'

const today = new Date()
const oneYearFromToday = addYears(today, 1)

export default function FrameworkBasedWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultFramework = searchParams.get('framework') ?? undefined
  const includeSuggestedControls = searchParams.get('suggestedControls') === 'true'
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const { mutateAsync: cloneControls, isPending: isControlBeingCloned } = useCloneControls()
  const { setCrumbs } = use(BreadcrumbContext)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const { useStepper } = defineStepper(
    { id: '0', label: 'Select Framework', schema: wizardSchema.pick({ framework: true, standardID: true, name: true }) },
    ...(includeSuggestedControls
      ? [{ id: '1', label: 'Import Controls', schema: suggestedControlsStepSchema }]
      : [{ id: '1', label: 'Select Categories', schema: wizardSchema.pick({ categories: true }) }]),
    { id: '2', label: 'Team Setup', schema: wizardSchema.pick({ programAdmins: true, programMembers: true, viewerIDs: true, editorIDs: true }) },
    { id: '3', label: 'Program Type', schema: wizardSchema.pick({ programKindName: true }) },
  )

  const stepper = useStepper()

  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      categories: includeSuggestedControls ? [] : ['Security'],
      suggestedControlIDs: [],
    },
  })

  const framework = useWatch({ control: methods.control, name: 'framework' })
  const disabledIDs = includeSuggestedControls || framework === 'SOC 2' ? [] : ['1']

  const handleNext = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (!stepper.isLast) {
      let isValid: boolean
      if (stepper.current.id === '0') {
        isValid = await methods.trigger(['framework', 'standardID', 'name'])
      } else if (stepper.current.id === '1') {
        isValid = includeSuggestedControls ? await methods.trigger(['suggestedControlIDs', 'categories']) : await methods.trigger('categories')
      } else {
        isValid = await methods.trigger(['programAdmins', 'programMembers', 'viewerIDs', 'editorIDs'])
      }

      if (!isValid) return

      let nextStepIndex = stepper.all.findIndex((s) => s.id === stepper.current.id) + 1
      while (disabledIDs.includes(stepper.all[nextStepIndex]?.id)) {
        nextStepIndex++
      }

      const nextStep = stepper.all[nextStepIndex]
      if (nextStep) stepper.goTo(nextStep.id)
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
      let prevStepIndex = stepper.all.findIndex((s) => s.id === stepper.current.id) - 1
      while (disabledIDs.includes(stepper.all[prevStepIndex]?.id)) {
        prevStepIndex--
      }

      const prevStep = stepper.all[prevStepIndex]
      if (prevStep) stepper.goTo(prevStep.id)
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
        programKindName: values.programKindName,
        startDate: today,
        endDate: oneYearFromToday,
        viewerIDs: values.viewerIDs,
        editorIDs: values.editorIDs,
      },
      categories: framework === 'SOC 2' ? values.categories : undefined,
      standardID: values.standardID,
      members: [...toMembers(values.programMembers, ProgramMembershipRole.MEMBER), ...toMembers(values.programAdmins, ProgramMembershipRole.ADMIN)],
    }

    try {
      const resp = await createProgram({ input })
      const programID = resp.createProgramWithMembers.program.id

      if (includeSuggestedControls && values.suggestedControlIDs?.length) {
        await cloneControls({
          input: {
            programID,
            controlIDs: values.suggestedControlIDs,
          },
        })
      }

      successNotification({
        title: 'Program Created',
        description: `Your program, ${input.program.name}, has been successfully created`,
      })
      router.push(`/programs/${programID}`)
    } catch (e) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(e),
      })
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Programs', href: '/programs' },
      { label: 'Create', href: '/programs/create' },
      { label: 'Framework based', href: '/programs/create/framework-based' },
    ])
  }, [setCrumbs])

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} disabledIDs={disabledIDs} className="mb-6" />
        <Separator className="" separatorClass="bg-card" />
        <FormProvider {...methods}>
          <form onSubmit={handleNext}>
            <div className="py-6">
              {stepper.switch({
                0: () => <SelectFrameworkStep required defaultFramework={defaultFramework} />,
                1: () => (includeSuggestedControls ? <SuggestedControlsStep frameworkName={framework} /> : <SelectCategoryStep />),
                2: () => <TeamSetupStep />,
                3: () => <StartTypeStep />,
              })}
              <div className="flex justify-between mt-8">
                <Button type="button" variant="secondary" onClick={handleBack} iconPosition="left">
                  Back
                </Button>
                <Button variant="primary" type="button" onClick={() => handleNext()} disabled={isPending || isControlBeingCloned} loading={isPending || isControlBeingCloned}>
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
