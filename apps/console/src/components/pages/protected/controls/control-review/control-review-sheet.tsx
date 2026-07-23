'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import { Form } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type ReviewQuery, type UpdateReviewInput, type ReviewReviewStatus } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useReview, useUpdateReview, useBulkDeleteReview } from '@/lib/graphql-hooks/review'
import { useCreateFinding, useFindingsWithFilter } from '@/lib/graphql-hooks/finding'
import { useCreateFindingControl } from '@/lib/graphql-hooks/finding-control'
import { useObjectPermissionRoles } from '@/components/shared/crud-base/use-object-permission'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { useNotification } from '@/hooks/useNotification'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import Skeleton from '@/components/shared/skeleton/skeleton'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { getEdgeIds, getEdgeNodes } from '@/components/shared/object-association/utils'
import { UploadedEvidenceSection } from '@/components/pages/protected/controls/quick-actions/uploaded-evidence-section'
import useControlReviewFormSchema, { CONTROL_REVIEW_DEFAULT_VALUES, type ControlReviewFormData } from './use-control-review-form-schema'
import { useControlReviewContext } from './use-control-review-context'
import ControlContextPanel from './control-context-panel'
import RelatedControlsSelector from './related-controls-selector'
import ReviewFieldsPanel from './review-fields-panel'
import ReviewSummaryPanel from './review-summary-panel'
import ReviewFindingsPanel from './review-findings-panel'
import FindingFieldsPanel from './finding-fields-panel'
import ReviewSheetFooter from './review-sheet-footer'
import { buildFindingInput, buildLinkedAssociationInput, hasFindingInput, resolveAuditorNotesHtml } from './review-submission'

type TControlReviewSheetProps = {
  controlId: string
  queryParamKey: string
}

const collectLinkedIds = (review: ReviewQuery['review'] | undefined, primaryControlId: string) => ({
  controlIDs: getEdgeIds(review?.controls?.edges).filter((id) => id !== primaryControlId),
  subcontrolIDs: getEdgeIds(review?.subcontrols?.edges),
})

const ControlReviewSheet: React.FC<TControlReviewSheetProps> = ({ controlId, queryParamKey }) => {
  const searchParams = useSearchParams()
  const reviewId = searchParams.get(queryParamKey)
  const isOpen = !!reviewId

  const { data: session } = useSession()
  const { push, replace } = useSmartRouter()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const [isEditing, setIsEditing] = useState(false)
  const [clearAuditorNotes, setClearAuditorNotes] = useState(false)
  const [pendingAction, setPendingAction] = useState<ReviewReviewStatus | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const initialLinkedIdsRef = useRef(collectLinkedIds(undefined, controlId))
  const savedCommentRef = useRef(false)
  const createdFindingIdRef = useRef<string | null>(null)
  const findingLinkedRef = useRef(false)

  const { form } = useControlReviewFormSchema()
  const { data, isLoading } = useReview(reviewId || undefined)
  const review = data?.review

  const permissionRoles = useObjectPermissionRoles(ObjectTypes.REVIEW, reviewId)
  const editAllowed = canEdit(permissionRoles, session)
  const deleteAllowed = canDelete(permissionRoles)

  const { control, evidenceItems } = useControlReviewContext(controlId, isOpen)

  const {
    findingsNodes,
    data: findingsData,
    isLoading: isLoadingFindings,
  } = useFindingsWithFilter({
    where: reviewId ? { hasReviewsWith: [{ id: reviewId }] } : undefined,
    pagination: DEFAULT_PAGINATION,
    enabled: isOpen,
  })

  const { mutateAsync: updateReview } = useUpdateReview()
  const { mutateAsync: deleteReviews, isPending: isDeleting } = useBulkDeleteReview()
  const { mutateAsync: createFinding } = useCreateFinding()
  const { mutateAsync: createFindingControl } = useCreateFindingControl()

  useEffect(() => {
    setIsEditing(false)
    setPendingAction(null)
    form.reset(CONTROL_REVIEW_DEFAULT_VALUES)
  }, [reviewId, form])

  const resetSubmissionGuards = () => {
    savedCommentRef.current = false
    createdFindingIdRef.current = null
    findingLinkedRef.current = false
  }

  const startEditing = () => {
    const snapshot = collectLinkedIds(review, controlId)
    initialLinkedIdsRef.current = snapshot
    form.reset({
      ...CONTROL_REVIEW_DEFAULT_VALUES,
      title: review?.title ?? '',
      testApplied: review?.details ?? '',
      externalID: review?.externalID ?? '',
      linkedControlIDs: snapshot.controlIDs,
      linkedSubcontrolIDs: snapshot.subcontrolIDs,
    })
    resetSubmissionGuards()
    setClearAuditorNotes(true)
    setIsEditing(true)
  }

  const cancelEditing = () => setIsEditing(false)

  const close = () => replace({ [queryParamKey]: null })

  const submit = async (formData: ControlReviewFormData, status: ReviewReviewStatus) => {
    if (!reviewId) {
      return
    }

    setPendingAction(status)
    try {
      const auditorNotesHtml = savedCommentRef.current ? null : await resolveAuditorNotesHtml(formData.auditorNotes, plateEditorHelper)

      const input: UpdateReviewInput = {
        title: formData.title,
        status,
        ...(formData.testApplied ? { details: formData.testApplied } : { clearDetails: true }),
        ...(formData.externalID ? { externalID: formData.externalID } : { clearExternalID: true }),
        ...buildLinkedAssociationInput(initialLinkedIdsRef.current, formData),
        ...(auditorNotesHtml ? { addComment: { text: auditorNotesHtml } } : {}),
      }

      await updateReview({ updateReviewId: reviewId, input })
      initialLinkedIdsRef.current = { controlIDs: formData.linkedControlIDs, subcontrolIDs: formData.linkedSubcontrolIDs }
      if (auditorNotesHtml) {
        savedCommentRef.current = true
      }

      if (hasFindingInput(formData)) {
        const reviewCoversThisControl = getEdgeIds(review?.controls?.edges).includes(controlId)
        const findingSubcontrolId = reviewCoversThisControl ? undefined : getEdgeIds(review?.subcontrols?.edges)[0]

        let findingId = createdFindingIdRef.current
        if (!findingId) {
          const createdFinding = await createFinding({ input: buildFindingInput(formData, { reviewId, subcontrolId: findingSubcontrolId }) })
          findingId = createdFinding?.createFinding?.finding?.id ?? null
          createdFindingIdRef.current = findingId
        }

        if (!findingId) {
          throw new Error('Finding could not be created')
        }

        if (!findingSubcontrolId && !findingLinkedRef.current) {
          await createFindingControl({ input: { findingID: findingId, controlID: controlId } })
          findingLinkedRef.current = true
        }
      }

      queryClient.invalidateQueries({ queryKey: ['controls', controlId, 'associations'] })

      successNotification({ title: 'Review updated', description: `The review has been saved as ${getEnumLabel(status)}.` })
      resetSubmissionGuards()
      setIsEditing(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const handleDelete = async () => {
    if (!reviewId) {
      return
    }

    try {
      const result = await deleteReviews({ ids: [reviewId] })
      const { notDeletedIDs, error } = result.deleteBulkReview
      if (error || (notDeletedIDs?.length ?? 0) > 0) {
        throw new Error(error || 'The review could not be deleted.')
      }

      queryClient.invalidateQueries({ queryKey: ['controls', controlId, 'associations'] })
      successNotification({ title: 'Review deleted' })
      setIsDeleteDialogOpen(false)
      close()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const linkedChips = useMemo(() => [...getEdgeNodes(review?.controls?.edges), ...getEdgeNodes(review?.subcontrols?.edges)], [review])

  const canUseActions = !isLoading && !!review

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(next) => (next ? undefined : close())}>
        <SheetContent
          minWidth={600}
          className="flex flex-col"
          header={
            <SheetHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-2xl leading-8 font-medium break-words">{review?.title || 'Review'}</span>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {review?.status ? <Badge variant="select">{getEnumLabel(review.status)}</Badge> : null}
                    {review?.reporter ? <span>Reported by {review.reporter}</span> : null}
                    {review?.reportedAt ? (
                      <span className="flex items-center gap-1">
                        on <DateCell value={review.reportedAt} />
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canUseActions && !isEditing && editAllowed && (
                    <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={startEditing} aria-label="Edit review">
                      <Pencil size={16} strokeWidth={2} />
                    </Button>
                  )}
                  {canUseActions && !isEditing && deleteAllowed && (
                    <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={() => setIsDeleteDialogOpen(true)} aria-label="Delete review">
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  )}
                  <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={close} aria-label="Close review sheet">
                    <X size={16} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </SheetHeader>
          }
        >
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton height={120} />
              <Skeleton height={200} />
            </div>
          ) : isEditing ? (
            <>
              <Form {...form}>
                <form className="flex flex-col gap-4 pr-2 pb-4" onSubmit={(e) => e.preventDefault()}>
                  <ControlContextPanel control={control}>
                    <RelatedControlsSelector form={form} controlId={controlId} />
                  </ControlContextPanel>
                  <UploadedEvidenceSection items={evidenceItems} controlId={controlId} onView={(evidenceId) => push({ id: evidenceId })} />
                  <ReviewFieldsPanel
                    form={form}
                    clearAuditorNotes={clearAuditorNotes}
                    onAuditorNotesCleared={() => setClearAuditorNotes(false)}
                    auditorNotesLabel="Add Auditor Note"
                    auditorNotesPlaceholder="Add a new note to this review..."
                  />
                  <ReviewFindingsPanel findings={findingsNodes} totalCount={findingsData?.findings?.totalCount} isLoading={isLoadingFindings} />
                  <FindingFieldsPanel form={form} />
                </form>
              </Form>

              <ReviewSheetFooter pendingAction={pendingAction} onCancel={cancelEditing} onSubmit={(status) => form.handleSubmit((formData) => submit(formData, status))()} submitLabel="Save Review" />
            </>
          ) : (
            <div className="flex flex-col gap-4 pr-2 pb-4">
              <ControlContextPanel control={control}>
                {linkedChips.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Reviewed Controls</span>
                    <div className="flex flex-wrap gap-1">
                      {linkedChips.map((node) => (
                        <ControlChip
                          key={node.id}
                          control={{ id: node.id, refCode: node.refCode, referenceFramework: node.referenceFramework ?? '', __typename: node.__typename }}
                          disableHref={node.__typename === ObjectTypes.SUBCONTROL}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </ControlContextPanel>
              <ReviewSummaryPanel review={review} />
              <ReviewFindingsPanel findings={findingsNodes} totalCount={findingsData?.findings?.totalCount} isLoading={isLoadingFindings} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        confirmationText="Delete"
        loading={isDeleting}
        title="Delete Review"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{review?.title}</b>.
          </>
        }
      />
    </>
  )
}

export default ControlReviewSheet
