'use client'

import React, { use, useEffect, useMemo, useRef, useState } from 'react'
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
import { useCreateProgramWithMembers, useGetProgramBasicInfo, useGetProgramGroups, useGetProgramMembers } from '@/lib/graphql-hooks/program'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ProgramMembershipRole, type CreateProgramWithMembersInput } from '@repo/codegen/src/schema'
import SelectSourceProgramStep from './steps/select-source-program-step'
import ProgramDetailsStep from './steps/program-details-step'
import AuditorStep from './steps/auditor-step'
import SelectControlsStep from './steps/select-controls-step'
import TeamStep from './steps/team-step'
import {
  auditorStepSchema,
  auditorValuesFrom,
  controlCountsByFramework,
  emptySelections,
  hasAuditorDetails,
  controlsStepSchema,
  detailsStepSchema,
  sourceProgramStepSchema,
  suggestedProgramName,
  teamStepSchema,
  validateFullAndNotify,
  wizardSchema,
  type WizardValues,
} from './from-existing-wizard-config'

const today = new Date()
const oneYearFromToday = addYears(today, 1)

const FromExistingProgramWizard = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const { setCrumbs } = use(BreadcrumbContext)
  const { data: session } = useSession()
  const currentUserID = session?.user?.userId
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const { useStepper } = defineStepper([
    { id: '0', label: 'Select a Program', schema: sourceProgramStepSchema },
    { id: '1', label: 'Program Details', schema: detailsStepSchema },
    { id: '2', label: 'Auditor', schema: auditorStepSchema },
    { id: '3', label: 'Team', schema: teamStepSchema },
    { id: '4', label: 'Select Controls', schema: controlsStepSchema },
  ])

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
      ...auditorValuesFrom(undefined, false),
      ...emptySelections(),
    },
  })

  const sourceProgramID = useWatch({ control: methods.control, name: 'sourceProgramID' })
  const { data: sourceData, isLoading: isSourceLoading } = useGetProgramBasicInfo(sourceProgramID || null)
  const { userOptions, isLoading: isMembersLoading } = useUserSelect({})
  const sourceProgram = sourceProgramID ? sourceData?.program : undefined
  const prefilledForIDRef = useRef<string>('')

  const { allControls: sourceControls, isLoading: isSourceControlsLoading } = useAllControlsGroupedWithListFields({
    where: { hasProgramsWith: [{ id: sourceProgramID }] },
    enabled: !!sourceProgramID,
  })

  const sourceControlIDs = useMemo(() => sourceControls.map((sourceControl) => sourceControl.id), [sourceControls])
  const controlsByFramework = useMemo(() => controlCountsByFramework(sourceControls), [sourceControls])
  const controlsInitialized = useWatch({ control: methods.control, name: 'controlsInitialized' })

  const ownerName = userOptions.find((user) => user.value === sourceProgram?.programOwnerID)?.label
  const ownerLeftOrg = !isMembersLoading && !!sourceProgram?.programOwnerID && !ownerName

  const { data: sourceMembersData, isLoading: isSourceMembersLoading } = useGetProgramMembers({ where: { programID: sourceProgramID || undefined }, enabled: !!sourceProgramID })
  const { data: sourceGroupsData, isLoading: isSourceGroupsLoading } = useGetProgramGroups({ programId: sourceProgramID || null })

  const sourceTeam = useMemo(() => {
    const orgUserIDs = new Set(userOptions.map((user) => user.value))
    const memberships = sourceMembersData?.programMemberships?.edges?.map((edge) => edge?.node).filter((node) => !!node) ?? []
    // the creator is added to the program automatically, sending them again violates the
    // unique membership constraint on (user_id, program_id)
    const inOrg = memberships.filter((membership) => orgUserIDs.has(membership.user.id) && membership.user.id !== currentUserID)

    return {
      admins: inOrg.filter((membership) => membership.role === ProgramMembershipRole.ADMIN).map((membership) => membership.user.id),
      members: inOrg.filter((membership) => membership.role !== ProgramMembershipRole.ADMIN).map((membership) => membership.user.id),
      editorIDs: sourceGroupsData?.program?.editors?.edges?.flatMap((edge) => (edge?.node?.id ? [edge.node.id] : [])) ?? [],
      viewerIDs: sourceGroupsData?.program?.viewers?.edges?.flatMap((edge) => (edge?.node?.id ? [edge.node.id] : [])) ?? [],
      droppedMemberCount: memberships.filter((membership) => !orgUserIDs.has(membership.user.id)).length,
    }
  }, [sourceMembersData, sourceGroupsData, userOptions, currentUserID])

  const isSourceTeamLoading = isSourceMembersLoading || isSourceGroupsLoading || isMembersLoading
  const teamInitialized = useWatch({ control: methods.control, name: 'teamInitialized' })

  // copy the source program into the form the first time each source program loads,
  // everything stays editable from there
  useEffect(() => {
    if (!sourceProgram || !sourceProgramID || isMembersLoading || prefilledForIDRef.current === sourceProgramID) return

    prefilledForIDRef.current = sourceProgramID
    const useSameAuditor = hasAuditorDetails(sourceProgram)

    methods.reset({
      sourceProgramID,
      name: suggestedProgramName(sourceProgram.name),
      description: sourceProgram.description ?? '',
      programKindName: sourceProgram.programKindName ?? undefined,
      framework: sourceProgram.frameworkName ?? '',
      startDate: today,
      endDate: oneYearFromToday,
      programOwnerID: ownerLeftOrg ? undefined : (sourceProgram.programOwnerID ?? undefined),
      useSameAuditor,
      ...auditorValuesFrom(sourceProgram, useSameAuditor),
      ...emptySelections(),
    })
  }, [sourceProgram, sourceProgramID, isMembersLoading, ownerLeftOrg, methods])

  // preselect the controls the source program already has, they get linked to the new program as is
  useEffect(() => {
    if (!sourceProgramID || isSourceControlsLoading || controlsInitialized) return

    methods.setValue('controlIDs', sourceControlIDs, { shouldDirty: true })
    methods.setValue('controlsInitialized', true)
  }, [sourceProgramID, isSourceControlsLoading, controlsInitialized, sourceControlIDs, methods])

  // carry over the admins, members and groups that are still available in this organization
  useEffect(() => {
    if (!sourceProgramID || isSourceTeamLoading || teamInitialized) return

    methods.setValue('programAdmins', sourceTeam.admins, { shouldDirty: true })
    methods.setValue('programMembers', sourceTeam.members, { shouldDirty: true })
    methods.setValue('editorIDs', sourceTeam.editorIDs, { shouldDirty: true })
    methods.setValue('viewerIDs', sourceTeam.viewerIDs, { shouldDirty: true })
    methods.setValue('teamInitialized', true)
  }, [sourceProgramID, isSourceTeamLoading, teamInitialized, sourceTeam, methods])

  const handleUseSameAuditorChange = (useSameAuditor: boolean) => {
    const { auditPartnerName, auditFirm, auditPartnerEmail } = auditorValuesFrom(sourceProgram, useSameAuditor)

    methods.setValue('auditPartnerName', auditPartnerName)
    methods.setValue('auditFirm', auditFirm)
    methods.setValue('auditPartnerEmail', auditPartnerEmail)
  }

  const handleNext = async () => {
    if (!stepper.isLast) {
      let isValid: boolean
      if (stepper.current.id === '0') {
        isValid = await methods.trigger('sourceProgramID')
      } else if (stepper.current.id === '1') {
        isValid = await methods.trigger(['name', 'startDate', 'endDate'])
      } else if (stepper.current.id === '2') {
        isValid = await methods.trigger('auditPartnerEmail')
      } else {
        isValid = await methods.trigger(['programAdmins', 'programMembers', 'editorIDs', 'viewerIDs'])
      }

      if (!isValid) {
        const firstError = Object.values(methods.formState.errors)[0]
        if (firstError && 'message' in firstError && firstError.message) {
          errorNotification({ title: 'Error', description: String(firstError.message) })
        }
        return
      }

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
      return
    }

    stepper.prev()
  }

  const handleQuickCreate = async () => {
    const validAll = await validateFullAndNotify(methods, errorNotification)
    if (!validAll) return
    await handleSubmit()
  }

  const handleSubmit = async () => {
    const values = methods.getValues()

    const toMembers = (userIDs: string[] | undefined, role: ProgramMembershipRole) => userIDs?.map((userID) => ({ userID, role })) ?? []

    const input: CreateProgramWithMembersInput = {
      members: [...toMembers(values.programAdmins, ProgramMembershipRole.ADMIN), ...toMembers(values.programMembers, ProgramMembershipRole.MEMBER)],
      program: {
        name: values.name,
        description: values.description,
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
      { label: 'From existing program', href: '/programs/create/from-existing' },
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
                  isLoading={!!sourceProgramID && isSourceLoading}
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
                  <Button type="button" variant="secondary" onClick={handleQuickCreate} disabled={!sourceProgramID || isPending || isSourceControlsLoading || isSourceTeamLoading} loading={isPending}>
                    Create
                  </Button>
                )}
                <Button type="button" variant="primary" onClick={handleNext} disabled={isPending} loading={isPending}>
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
