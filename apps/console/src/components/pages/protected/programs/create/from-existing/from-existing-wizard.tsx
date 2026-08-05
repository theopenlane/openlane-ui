'use client'

import React, { use, useEffect, useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { addYears } from 'date-fns'
import { Button } from '@repo/ui/button'
import { Separator } from '@repo/ui/separator'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/program'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ProgramMembershipRole, type CreateProgramWithMembersInput } from '@repo/codegen/src/schema'
import SelectSourceProgramStep from './steps/select-source-program-step'
import ProgramDetailsStep from './steps/program-details-step'
import AuditorStep from './steps/auditor-step'
import SelectControlsStep from './steps/select-controls-step'
import TeamStep from './steps/team-step'
import { auditorValuesFrom, emptySelections, validateFullAndNotify, wizardSchema, type WizardValues } from './from-existing-wizard-config'
import { useFromExistingPrefill } from './use-from-existing-prefill'

const stepIds = ['0', '1', '2', '3', '4'] as const

const { useStepper } = defineStepper([
  { id: '0', label: 'Select a Program' },
  { id: '1', label: 'Program Details' },
  { id: '2', label: 'Auditor' },
  { id: '3', label: 'Team' },
  { id: '4', label: 'Select Controls' },
])

const stepTriggerFields: Partial<Record<string, (keyof WizardValues)[]>> = {
  '0': ['sourceProgramID'],
  '1': ['name', 'startDate', 'endDate'],
  '2': ['auditPartnerEmail'],
}

const FromExistingProgramWizard = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const { setCrumbs } = use(BreadcrumbContext)
  const { data: session } = useSession()
  const currentUserID = session?.user?.userId
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [today] = useState(() => new Date())
  const [oneYearFromToday] = useState(() => addYears(new Date(), 1))

  const stepper = useStepper()

  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      sourceProgramID: searchParams.get('from') ?? '',
      name: '',
      description: '',
      framework: '',
      startDate: today,
      endDate: oneYearFromToday,
      useSameAuditor: true,
      ...auditorValuesFrom(),
      ...emptySelections(),
    },
  })

  const sourceProgramID = useWatch({ control: methods.control, name: 'sourceProgramID' })

  const {
    sourceProgram,
    isSourceLoading,
    isPrefillPending,
    sourceControlIDs,
    controlsByFramework,
    isSourceControlsLoading,
    sourceTeam,
    isSourceTeamLoading,
    ownerName,
    ownerLeftOrg,
    handleUseSameAuditorChange,
  } = useFromExistingPrefill({ methods, sourceProgramID, currentUserID, today, oneYearFromToday })

  const submitIfValid = async () => {
    const firstInvalidStep = await validateFullAndNotify(methods, errorNotification)
    if (firstInvalidStep !== null) {
      stepper.goTo(stepIds[firstInvalidStep] ?? '0')
      return
    }
    await handleSubmit()
  }

  const handleNext = async () => {
    if (stepper.current.id === '0' && isPrefillPending) return

    if (stepper.isLast) {
      await submitIfValid()
      return
    }

    const fields = stepTriggerFields[stepper.current.id]
    if (fields) {
      const isValid = await methods.trigger(fields)
      if (!isValid) {
        const firstError = fields.map((field) => methods.formState.errors[field]).find(Boolean)
        if (firstError?.message) {
          errorNotification({ title: 'Error', description: String(firstError.message) })
        }
        return
      }
    }

    stepper.next()
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      setShowExitConfirm(true)
      return
    }

    stepper.prev()
  }

  const handleSubmit = async () => {
    const values = methods.getValues()

    const toMembers = (userIDs: string[] | undefined, role: ProgramMembershipRole) => userIDs?.map((userID) => ({ userID, role })) ?? []

    const input: CreateProgramWithMembersInput = {
      members: [
        ...toMembers(values.programAdmins, ProgramMembershipRole.ADMIN),
        ...toMembers(values.programMembers, ProgramMembershipRole.MEMBER),
        ...toMembers(values.programAuditors, ProgramMembershipRole.AUDITOR),
      ],
      program: {
        name: values.name,
        description: values.description || undefined,
        programKindName: values.programKindName,
        frameworkName: values.framework || undefined,
        startDate: values.startDate ?? undefined,
        endDate: values.endDate ?? undefined,
        programOwnerID: values.programOwnerID || undefined,
        auditor: values.auditPartnerName || undefined,
        auditorEmail: values.auditPartnerEmail || undefined,
        auditFirm: values.auditFirm || undefined,
        controlIDs: values.controlIDs ?? [],
        editorIDs: values.editorIDs ?? [],
        viewerIDs: values.viewerIDs ?? [],
      },
    }

    try {
      const resp = await createProgram({ input })
      const programID = resp.createProgramWithMembers.program.id

      successNotification({
        title: 'Program Created',
        description: `Your program, ${values.name}, has been successfully created`,
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
      { label: 'Clone', href: '/programs/create/from-existing' },
    ])
  }, [setCrumbs])

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} className="mb-6" />
        <Separator separatorClass="bg-card" />
        <FormProvider {...methods}>
          <div className="py-6">
            {stepper.match({
              0: () => (
                <SelectSourceProgramStep
                  sourceProgram={sourceProgram}
                  isLoading={!!sourceProgramID && (isSourceLoading || isPrefillPending)}
                  controlsByFramework={controlsByFramework}
                  controlCount={sourceControlIDs.length}
                  isControlsLoading={!!sourceProgramID && isSourceControlsLoading}
                  ownerName={ownerName}
                  ownerLeftOrg={ownerLeftOrg}
                  newStartDate={today}
                  newEndDate={oneYearFromToday}
                  team={sourceTeam}
                  isTeamLoading={!!sourceProgramID && isSourceTeamLoading}
                />
              ),
              1: () => <ProgramDetailsStep sourceProgram={sourceProgram} ownerLeftOrg={ownerLeftOrg} />,
              2: () => <AuditorStep sourceProgram={sourceProgram} onUseSameAuditorChange={handleUseSameAuditorChange} />,
              3: () => <TeamStep sourceProgram={sourceProgram} droppedMemberCount={sourceTeam.droppedMemberCount} />,
              4: () => <SelectControlsStep sourceProgramName={sourceProgram?.name} />,
            })}

            <div className="flex justify-between mt-8">
              <Button type="button" variant="secondary" onClick={handleBack} iconPosition="left">
                Back
              </Button>
              <div className="flex gap-2">
                {!stepper.isLast && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={submitIfValid}
                    disabled={!sourceProgramID || isPending || isPrefillPending || isSourceControlsLoading || isSourceTeamLoading}
                    loading={isPending}
                  >
                    Create
                  </Button>
                )}
                <Button type="button" variant="primary" onClick={handleNext} disabled={isPending || (stepper.current.id === '0' && isPrefillPending)} loading={isPending}>
                  {stepper.isLast ? 'Create' : 'Continue'}
                </Button>
              </div>
            </div>
          </div>
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

export default FromExistingProgramWizard
