'use client'

import React, { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X } from 'lucide-react'
import { SheetHeader } from '@repo/ui/sheet'
import { Form } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ReviewReviewStatus, type CreateReviewInput, type EntityQuery, type UpdateReviewInput } from '@repo/codegen/src/schema'
import { useBulkDeleteReview, useCreateReview, useUpdateReview, type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useObjectPermissionRoles } from '@/components/shared/crud-base/use-object-permission'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import useVendorReviewFormSchema, { type VendorReviewFormData } from './use-vendor-review-form-schema'
import VendorReviewContextPanel from './vendor-review-context-panel'
import VendorReviewFieldsPanel from './vendor-review-fields-panel'
import VendorReviewFooter, { type TVendorReviewAction } from './vendor-review-footer'
import { buildVendorReviewDefaults, buildVendorRiskUpdate } from './vendor-review-utils'

const STATUS_BY_ACTION: Partial<Record<TVendorReviewAction, ReviewReviewStatus>> = {
  draft: ReviewReviewStatus.IN_PROGRESS,
  complete: ReviewReviewStatus.COMPLETED,
  completeAndApprove: ReviewReviewStatus.COMPLETED,
}

type TVendorReviewSheetBodyProps = {
  vendor: EntityQuery['entity']
  review?: ReviewsNodeNonNull
  canEditVendor: boolean
  onClose: () => void
}

const VendorReviewSheetBody: React.FC<TVendorReviewSheetBodyProps> = ({ vendor, review, canEditVendor, onClose }) => {
  const isCreate = !review
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()

  const [isEditing, setIsEditing] = useState(isCreate)
  const [pendingAction, setPendingAction] = useState<TVendorReviewAction | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [createdReviewId, setCreatedReviewId] = useState<string | null>(null)

  const stagedFilesRef = useRef<File[]>([])
  const existingFileIdsRef = useRef<string[]>([])
  const isSubmittingRef = useRef(false)

  const [initialValues] = useState(() => buildVendorReviewDefaults(vendor, review))
  const { form } = useVendorReviewFormSchema(initialValues)
  const savedDescription = review?.details ?? ''
  const reviewId = review?.id ?? createdReviewId ?? undefined

  const permissionRoles = useObjectPermissionRoles(ObjectTypes.REVIEW, review?.id)
  const editAllowed = canEdit(permissionRoles, session)
  const deleteAllowed = canDelete(permissionRoles)

  const { mutateAsync: createReview } = useCreateReview()
  const { mutateAsync: updateReview } = useUpdateReview()
  const { mutateAsync: deleteReviews, isPending: isDeleting } = useBulkDeleteReview()
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const startEditing = () => {
    form.reset(buildVendorReviewDefaults(vendor, review))
    setIsEditing(true)
  }

  const submit = async (formData: VendorReviewFormData, action: TVendorReviewAction) => {
    if (isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setPendingAction(action)

    const now = new Date().toISOString()
    const nextStatus = STATUS_BY_ACTION[action]
    const approves = action === 'approve' || action === 'completeAndApprove'
    const completes = nextStatus === ReviewReviewStatus.COMPLETED

    try {
      const descriptionHtml = await plateToHtmlOrNull(formData.description, plateEditorHelper)
      const existingReviewId = review?.id ?? createdReviewId
      let didCreate = false

      if (existingReviewId) {
        const input: UpdateReviewInput = {
          title: formData.title,
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(descriptionHtml ? { details: descriptionHtml } : savedDescription ? { clearDetails: true } : {}),
          ...(approves ? { approved: true, approvedAt: now } : action === 'draft' ? { approved: false, clearApprovedAt: true } : {}),
          ...(action === 'draft' ? { clearReviewedAt: true } : completes && !review?.reviewedAt ? { reviewedAt: now } : {}),
          ...(review?.environmentName || !vendor.environmentName ? {} : { environmentName: vendor.environmentName }),
          ...(review?.scopeName || !vendor.scopeName ? {} : { scopeName: vendor.scopeName }),
        }

        await updateReview({ updateReviewId: existingReviewId, input })
      } else {
        const input: CreateReviewInput = {
          title: formData.title,
          status: nextStatus ?? ReviewReviewStatus.IN_PROGRESS,
          approved: approves,
          entityIDs: [vendor.id],
          reportedAt: now,
          reporter: session?.user?.email ?? undefined,
          reviewerID: session?.user?.userId ?? undefined,
          ...(approves ? { approvedAt: now } : {}),
          ...(completes ? { reviewedAt: now } : {}),
          ...(descriptionHtml ? { details: descriptionHtml } : {}),
          ...(formData.tier ? { classification: formData.tier } : {}),
          ...(vendor.environmentName ? { environmentName: vendor.environmentName } : {}),
          ...(vendor.scopeName ? { scopeName: vendor.scopeName } : {}),
          ...(existingFileIdsRef.current.length > 0 ? { fileIDs: existingFileIdsRef.current } : {}),
        }

        const result = await createReview({ input, reviewFiles: stagedFilesRef.current.length > 0 ? stagedFilesRef.current : undefined })
        stagedFilesRef.current = []
        existingFileIdsRef.current = []
        setCreatedReviewId(result.createReview.review.id)
        didCreate = true

        queryClient.invalidateQueries({ queryKey: ['entities'] })
      }

      const riskInput = canEditVendor ? buildVendorRiskUpdate(vendor, formData) : null
      if (riskInput) {
        await updateEntity({ updateEntityId: vendor.id, input: riskInput })
      }

      successNotification({
        title: action === 'draft' ? 'Draft saved' : didCreate ? 'Review created' : 'Review updated',
        description: approves ? 'The review has been saved and approved.' : nextStatus ? `The review has been saved as ${getEnumLabel(nextStatus)}.` : 'Your changes have been saved.',
      })

      if (isCreate) {
        onClose()
      } else {
        setIsEditing(false)
      }
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      isSubmittingRef.current = false
      setPendingAction(null)
    }
  }

  const handleDelete = async () => {
    if (!review) {
      return
    }

    try {
      const result = await deleteReviews({ ids: [review.id] })
      const { notDeletedIDs, error } = result.deleteBulkReview
      if (error || (notDeletedIDs?.length ?? 0) > 0) {
        throw new Error(error || 'The review could not be deleted.')
      }

      successNotification({ title: 'Review deleted' })
      setIsDeleteDialogOpen(false)
      onClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const headerTitle = isCreate ? 'Create Review' : isEditing ? 'Edit Review' : review.title
  const showViewActions = !isCreate && !isEditing
  const isCompleted = review?.status === ReviewReviewStatus.COMPLETED

  return (
    <>
      <SheetHeader className="sticky top-0 z-10 bg-secondary pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-2xl leading-8 font-medium break-words">{headerTitle}</span>
            {review && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {review.status ? <Badge variant="select">{getEnumLabel(review.status)}</Badge> : null}
                {review.approved ? <Badge variant="green">Approved</Badge> : null}
                {review.reporter ? <span>Reported by {review.reporter}</span> : null}
                {review.reportedAt ? (
                  <span className="flex items-center gap-1">
                    on <DateCell value={review.reportedAt} />
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showViewActions && editAllowed && (
              <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={startEditing} aria-label="Edit review">
                <Pencil size={16} strokeWidth={2} />
              </Button>
            )}
            {showViewActions && deleteAllowed && (
              <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={() => setIsDeleteDialogOpen(true)} aria-label="Delete review">
                <Trash2 size={16} strokeWidth={2} />
              </Button>
            )}
            <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={onClose} aria-label="Close review sheet">
              <X size={16} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </SheetHeader>

      <Form {...form}>
        <form className="flex flex-col gap-4 pr-2 pb-4" onSubmit={(e) => e.preventDefault()}>
          <VendorReviewContextPanel vendor={vendor} form={form} isEditing={isEditing && canEditVendor} />
          <VendorReviewFieldsPanel
            form={form}
            isEditing={isEditing}
            reviewId={reviewId}
            savedDescription={savedDescription}
            onStagedFilesChange={(files) => {
              stagedFilesRef.current = files
            }}
            onExistingFileIdsChange={(fileIds) => {
              existingFileIdsRef.current = fileIds
            }}
          />
        </form>
      </Form>

      {isEditing && (
        <VendorReviewFooter
          pendingAction={pendingAction}
          isCreate={isCreate}
          isCompleted={isCompleted}
          isApproved={!!review?.approved}
          onCancel={isCreate ? undefined : () => setIsEditing(false)}
          onSubmit={(action) => form.handleSubmit((formData) => submit(formData, action))()}
        />
      )}

      {review && (
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDelete}
          confirmationText="Delete"
          loading={isDeleting}
          title="Delete Review"
          description={
            <>
              This action cannot be undone. This will permanently remove <b>{review.title}</b>.
            </>
          }
        />
      )}
    </>
  )
}

export default VendorReviewSheetBody
