import { useEffect, useMemo, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { useGetProgramBasicInfo, useGetProgramGroups, useGetProgramMembers } from '@/lib/graphql-hooks/program'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useAllControlsGroupedWithListFields } from '@/lib/graphql-hooks/control'
import { ControlControlStatus, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { auditorValuesFrom, controlCountsByFramework, emptySelections, hasAuditorDetails, suggestedProgramName, type WizardValues } from './from-existing-wizard-config'

type UseFromExistingPrefillArgs = {
  methods: UseFormReturn<WizardValues>
  sourceProgramID: string
  currentUserID?: string
  today: Date
  oneYearFromToday: Date
}

export const useFromExistingPrefill = ({ methods, sourceProgramID, currentUserID, today, oneYearFromToday }: UseFromExistingPrefillArgs) => {
  const [prefilledForID, setPrefilledForID] = useState('')

  const { data: sourceData, isLoading: isSourceInfoLoading, isPlaceholderData: isSourceInfoPlaceholder } = useGetProgramBasicInfo(sourceProgramID || null)
  const { userOptions, isLoading: isMembersLoading } = useUserSelect({})
  const sourceProgram = sourceProgramID && !isSourceInfoPlaceholder ? sourceData?.program : undefined
  const isSourceLoading = isSourceInfoLoading || isSourceInfoPlaceholder

  const {
    allControls: sourceControls,
    isLoading: isFetchingSourceControls,
    isSuccess: sourceControlsFetched,
    isPlaceholderData: isSourceControlsPlaceholder,
  } = useAllControlsGroupedWithListFields({
    where: {
      and: [
        { hasProgramsWith: [{ id: sourceProgramID }] },
        { isTrustCenterControl: false },
        { or: [{ statusNEQ: ControlControlStatus.ARCHIVED }, { statusIsNil: true }] },
        { or: [{ systemOwned: false }, { systemOwnedIsNil: true }] },
      ],
    },
    enabled: !!sourceProgramID,
  })

  const sourceControlIDs = useMemo(() => sourceControls.map((sourceControl) => sourceControl.id), [sourceControls])
  const controlsByFramework = useMemo(() => controlCountsByFramework(sourceControls), [sourceControls])

  const ownerName = userOptions.find((user) => user.value === sourceProgram?.programOwnerID)?.label
  const ownerLeftOrg = !isMembersLoading && !!sourceProgram?.programOwnerID && !ownerName

  const {
    data: sourceMembersData,
    isSuccess: sourceMembersFetched,
    isPlaceholderData: isSourceMembersPlaceholder,
  } = useGetProgramMembers({ where: { programID: sourceProgramID || undefined }, enabled: !!sourceProgramID })
  const { data: sourceGroupsData, isSuccess: sourceGroupsFetched, isPlaceholderData: isSourceGroupsPlaceholder } = useGetProgramGroups({ programId: sourceProgramID || null })

  const sourceTeam = useMemo(() => {
    const orgUserIDs = new Set(userOptions.map((user) => user.value))
    const memberships = sourceMembersData?.programMemberships?.edges?.map((edge) => edge?.node).filter((node) => !!node) ?? []
    const inOrg = memberships.filter((membership) => orgUserIDs.has(membership.user.id) && membership.user.id !== currentUserID)

    return {
      admins: inOrg.filter((membership) => membership.role === ProgramMembershipRole.ADMIN).map((membership) => membership.user.id),
      auditors: inOrg.filter((membership) => membership.role === ProgramMembershipRole.AUDITOR).map((membership) => membership.user.id),
      members: inOrg.filter((membership) => membership.role === ProgramMembershipRole.MEMBER).map((membership) => membership.user.id),
      editorIDs: sourceGroupsData?.program?.editors?.edges?.flatMap((edge) => (edge?.node?.id ? [edge.node.id] : [])) ?? [],
      viewerIDs: sourceGroupsData?.program?.viewers?.edges?.flatMap((edge) => (edge?.node?.id ? [edge.node.id] : [])) ?? [],
      droppedMemberCount: memberships.filter((membership) => !orgUserIDs.has(membership.user.id)).length,
    }
  }, [sourceMembersData, sourceGroupsData, userOptions, currentUserID])

  const isSourceTeamLoading = !sourceMembersFetched || !sourceGroupsFetched || isMembersLoading || isSourceMembersPlaceholder || isSourceGroupsPlaceholder
  const isSourceControlsLoading = isFetchingSourceControls || !sourceControlsFetched || isSourceControlsPlaceholder
  const isPrefillPending = !!sourceProgramID && prefilledForID !== sourceProgramID

  const controlsInitialized = useWatch({ control: methods.control, name: 'controlsInitialized' })
  const teamInitialized = useWatch({ control: methods.control, name: 'teamInitialized' })

  useEffect(() => {
    if (!sourceProgram || !sourceProgramID || isMembersLoading || prefilledForID === sourceProgramID) return

    setPrefilledForID(sourceProgramID)

    methods.reset({
      sourceProgramID,
      name: suggestedProgramName(sourceProgram.name),
      description: sourceProgram.description ?? '',
      programKindName: sourceProgram.programKindName ?? undefined,
      framework: sourceProgram.frameworkName ?? '',
      startDate: today,
      endDate: oneYearFromToday,
      programOwnerID: ownerLeftOrg ? undefined : (sourceProgram.programOwnerID ?? undefined),
      useSameAuditor: hasAuditorDetails(sourceProgram),
      ...auditorValuesFrom(sourceProgram),
      ...emptySelections(),
    })
  }, [sourceProgram, sourceProgramID, isMembersLoading, prefilledForID, ownerLeftOrg, today, oneYearFromToday, methods])

  useEffect(() => {
    if (!sourceProgramID || isPrefillPending || isSourceControlsLoading || controlsInitialized) return

    methods.setValue('controlIDs', sourceControlIDs, { shouldDirty: true })
    methods.setValue('controlsInitialized', true)
  }, [sourceProgramID, isPrefillPending, isSourceControlsLoading, controlsInitialized, sourceControlIDs, methods])

  useEffect(() => {
    if (!sourceProgramID || isPrefillPending || isSourceTeamLoading || teamInitialized) return

    methods.setValue('programAdmins', sourceTeam.admins, { shouldDirty: true })
    methods.setValue('programMembers', sourceTeam.members, { shouldDirty: true })
    methods.setValue('programAuditors', sourceTeam.auditors, { shouldDirty: true })
    methods.setValue('editorIDs', sourceTeam.editorIDs, { shouldDirty: true })
    methods.setValue('viewerIDs', sourceTeam.viewerIDs, { shouldDirty: true })
    methods.setValue('teamInitialized', true)
  }, [sourceProgramID, isPrefillPending, isSourceTeamLoading, teamInitialized, sourceTeam, methods])

  const handleUseSameAuditorChange = (useSameAuditor: boolean) => {
    if (!useSameAuditor) return

    const { auditPartnerName, auditFirm, auditPartnerEmail } = auditorValuesFrom(sourceProgram)

    methods.setValue('auditPartnerName', auditPartnerName, { shouldValidate: true, shouldDirty: true })
    methods.setValue('auditFirm', auditFirm, { shouldValidate: true, shouldDirty: true })
    methods.setValue('auditPartnerEmail', auditPartnerEmail, { shouldValidate: true, shouldDirty: true })
  }

  return {
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
  }
}
