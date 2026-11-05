import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ReportMembershipRole, ReportReportStatus, ReportReportVisibility, type UpdateReportInput } from '@repo/codegen/src/schema'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { type TFieldMappers, omit, passthrough, useDirtyInput } from '@/hooks/useDirtyInput'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { invalidateReportQueries, type TSavedReportRef, useCreateReport, useUpdateReport } from '@/lib/graphql-hooks/report'
import { type TReportSharing, useCreateBulkReportMembership, useDeleteReportMembership, useReportSharing } from '@/lib/graphql-hooks/report-membership'
import type { TReportQuery } from '@/lib/report/build-report-query'
import { reportVisibilityOf } from '@/lib/report/saved-report'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'

const reportShareeSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['user', 'group']),
  email: z.string().optional(),
  membershipId: z.string().optional(),
})

const reportSharingSchema = z
  .object({
    name: z.string().trim().min(1, 'Give this report a name.'),
    visibility: z.nativeEnum(ReportReportVisibility),
    sharees: z.array(reportShareeSchema),
  })
  .superRefine(({ visibility, sharees }, context) => {
    if (visibility === ReportReportVisibility.RESTRICTED && sharees.length === 0) {
      context.addIssue({ code: 'custom', path: ['sharees'], message: 'Select at least one user or group.' })
    }
  })

export type TReportSharee = z.infer<typeof reportShareeSchema>
export type TReportSharingForm = z.infer<typeof reportSharingSchema>

const toReportSharees = ({ memberships, groups }: TReportSharing, currentUserId: string | undefined): TReportSharee[] => [
  ...memberships
    .filter((membership) => membership.role !== ReportMembershipRole.OWNER && membership.userID !== currentUserId)
    .map((membership) => ({ id: membership.userID, name: membership.user.displayName || membership.user.email, email: membership.user.email, kind: 'user' as const, membershipId: membership.id })),
  ...groups.map((group) => ({ id: group.id, name: group.displayName || group.name, kind: 'group' as const })),
]

const idsOfKind = (sharees: readonly (Partial<TReportSharee> | undefined)[] | undefined, kind: TReportSharee['kind']): string[] =>
  (sharees ?? []).flatMap((sharee) => (sharee?.kind === kind && sharee.id ? [sharee.id] : []))

const REPORT_UPDATE_FIELDS = {
  name: passthrough,
  visibility: (visibility) => ({ visibility }),
  sharees: omit,
} satisfies TFieldMappers<TReportSharingForm, UpdateReportInput>

type TUseReportSharingFormArgs = {
  report: TSavedReportRef | null
  suggestedName?: string
}

export const useReportSharingForm = ({ report, suggestedName = '' }: TUseReportSharingFormArgs) => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { data: sharing, isPending, error } = useReportSharing(report?.id)
  useQueryErrorNotification({ error, description: 'Failed to load who this report is shared with' })

  const form = useForm<TReportSharingForm>({
    resolver: zodResolver(reportSharingSchema),
    defaultValues: { name: report?.name ?? suggestedName, visibility: reportVisibilityOf(report?.visibility), sharees: [] },
  })
  const buildDirtyInput = useDirtyInput(form)
  const { mutateAsync: createReport } = useCreateReport()
  const { mutateAsync: updateReport } = useUpdateReport()
  const { mutateAsync: createMemberships } = useCreateBulkReportMembership()
  const { mutateAsync: deleteMembership } = useDeleteReportMembership()
  const inFlightRef = useRef(false)
  const [isSaving, setIsSaving] = useState(false)

  const reportName = report?.name
  const reportVisibility = report?.visibility
  const currentUserId = session?.user?.userId
  const loadedSharees = useMemo(() => (sharing ? toReportSharees(sharing, currentUserId) : []), [currentUserId, sharing])

  const excludedUserIds = useMemo(() => {
    const ownerIds = (sharing?.memberships ?? []).filter((membership) => membership.role === ReportMembershipRole.OWNER).map((membership) => membership.userID)

    return currentUserId ? [...ownerIds, currentUserId] : ownerIds
  }, [currentUserId, sharing])

  useEffect(() => {
    if (!sharing || reportName === undefined) return

    form.reset({ name: reportName, visibility: reportVisibilityOf(reportVisibility), sharees: loadedSharees }, { keepDirtyValues: true })
  }, [form, loadedSharees, reportName, reportVisibility, sharing])

  const syncMembers = useCallback(
    async (reportId: string, { visibility, sharees }: TReportSharingForm, loaded: TReportSharee[]) => {
      if (visibility !== ReportReportVisibility.RESTRICTED) return

      const loadedUserIds = new Set(idsOfKind(loaded, 'user'))
      const currentUserIds = new Set(idsOfKind(sharees, 'user'))
      const userIdsToAdd = [...currentUserIds].filter((id) => !loadedUserIds.has(id))
      const membershipIdsToRemove = loaded.flatMap((sharee) => (sharee.kind === 'user' && sharee.membershipId && !currentUserIds.has(sharee.id) ? [sharee.membershipId] : []))

      if (userIdsToAdd.length > 0) await createMemberships({ input: userIdsToAdd.map((userID) => ({ reportID: reportId, userID })) })
      const removals = await Promise.allSettled(membershipIdsToRemove.map((id) => deleteMembership({ deleteReportMembershipId: id })))
      const failedRemovals = removals.filter((removal) => removal.status === 'rejected')

      if (failedRemovals.length > 0) {
        throw new UserFacingError(`Could not remove ${pluralizeWithCount(failedRemovals.length, 'person', 'people')}, so their access is unchanged. Please try again later.`, {
          cause: failedRemovals[0].reason,
        })
      }
    },
    [createMemberships, deleteMembership],
  )

  const guarded = useCallback(
    async <T>(run: () => Promise<T>): Promise<T | undefined> => {
      if (inFlightRef.current) return undefined

      inFlightRef.current = true
      setIsSaving(true)
      try {
        return await run()
      } finally {
        inFlightRef.current = false
        setIsSaving(false)
        void invalidateReportQueries(queryClient)
      }
    },
    [queryClient],
  )

  const create = useCallback(
    (values: TReportSharingForm, definition: TReportQuery) =>
      guarded(async () => {
        const { name, visibility, sharees } = values
        const viewerIDs = visibility === ReportReportVisibility.RESTRICTED ? idsOfKind(sharees, 'group') : []
        const { createReport: created } = await createReport({
          input: {
            name,
            visibility,
            status: ReportReportStatus.SAVED,
            query: definition.query,
            variables: definition.variables,
            reportOwnerID: currentUserId,
            ...(viewerIDs.length > 0 ? { viewerIDs } : {}),
          },
        })
        const id = created.report.id

        try {
          await syncMembers(id, values, [])
          return { id }
        } catch (sharingError) {
          return { id, sharingError }
        }
      }),
    [createReport, currentUserId, guarded, syncMembers],
  )

  const update = useCallback(
    (reportId: string, values: TReportSharingForm, definitionChanges: Partial<UpdateReportInput> = {}) =>
      guarded(async () => {
        const viewerChanges =
          values.visibility === ReportReportVisibility.RESTRICTED ? getAssociationInput({ viewerIDs: idsOfKind(loadedSharees, 'group') }, { viewerIDs: idsOfKind(values.sharees, 'group') }) : {}
        const input = { ...(await buildDirtyInput<UpdateReportInput>(values, REPORT_UPDATE_FIELDS)), ...definitionChanges, ...viewerChanges }
        if (Object.keys(input).length > 0) await updateReport({ updateReportId: reportId, input })

        await syncMembers(reportId, values, loadedSharees)
        form.reset(values)

        return true
      }),
    [buildDirtyInput, form, guarded, loadedSharees, syncMembers, updateReport],
  )

  return { form, create, update, isSaving, isLoadingSharing: !!report && isPending, sharingFailed: !!report && !!error, excludedUserIds }
}
