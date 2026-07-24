'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import { Form } from '@repo/ui/form'
import { X } from 'lucide-react'
import { type CreateReviewInput, ReviewReviewStatus } from '@repo/codegen/src/schema'
import { useCreateReview, useUpdateReview } from '@/lib/graphql-hooks/review'
import { useCreateFinding } from '@/lib/graphql-hooks/finding'
import { useCreateFindingControl } from '@/lib/graphql-hooks/finding-control'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import useControlReviewFormSchema, { CONTROL_REVIEW_DEFAULT_VALUES, type ControlReviewFormData } from '@/components/pages/protected/controls/control-review/use-control-review-form-schema'
import { useControlReviewContext } from '@/components/pages/protected/controls/control-review/use-control-review-context'
import ControlContextPanel from '@/components/pages/protected/controls/control-review/control-context-panel'
import RelatedControlsSelector from '@/components/pages/protected/controls/control-review/related-controls-selector'
import ReviewFieldsPanel from '@/components/pages/protected/controls/control-review/review-fields-panel'
import FindingFieldsPanel from '@/components/pages/protected/controls/control-review/finding-fields-panel'
import ReviewSheetFooter from '@/components/pages/protected/controls/control-review/review-sheet-footer'
import { buildFindingInput, hasFindingInput, resolveAuditorNotesHtml } from '@/components/pages/protected/controls/control-review/review-submission'
import { UploadedEvidenceSection } from './uploaded-evidence-section'

type TCreateControlReviewSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  controlId: string
  subcontrolId?: string
  programId?: string
}

const CreateControlReviewSheet: React.FC<TCreateControlReviewSheetProps> = ({ open, onOpenChange, controlId, subcontrolId, programId }) => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const { control, evidenceItems } = useControlReviewContext(controlId, open)

  const { mutateAsync: createReview } = useCreateReview()
  const { mutateAsync: updateReview } = useUpdateReview()
  const { mutateAsync: createFinding } = useCreateFinding()
  const { mutateAsync: createFindingControl } = useCreateFindingControl()
  const plateEditorHelper = usePlateEditor()

  const [clearAuditorNotes, setClearAuditorNotes] = useState(false)
  const [pendingAction, setPendingAction] = useState<ReviewReviewStatus | null>(null)
  const createdReviewIdRef = useRef<string | null>(null)
  const createdFindingIdRef = useRef<string | null>(null)
  const commentSavedRef = useRef(false)
  const findingLinkedRef = useRef(false)

  const { push } = useSmartRouter()

  const { form } = useControlReviewFormSchema()

  useEffect(() => {
    if (open && control?.refCode && !form.getValues('title')) {
      form.setValue('title', `${control.refCode} Review - ${new Date().getFullYear()}`)
    }
  }, [open, control?.refCode, form])

  const resetAndClose = () => {
    createdReviewIdRef.current = null
    createdFindingIdRef.current = null
    commentSavedRef.current = false
    findingLinkedRef.current = false
    form.reset(CONTROL_REVIEW_DEFAULT_VALUES)
    setClearAuditorNotes(true)
    onOpenChange(false)
  }

  const submit = async (data: ControlReviewFormData, status: ReviewReviewStatus) => {
    setPendingAction(status)
    try {
      const controlIDs = subcontrolId ? [...data.linkedControlIDs] : [controlId, ...data.linkedControlIDs]
      const subcontrolIDs = subcontrolId ? [subcontrolId, ...data.linkedSubcontrolIDs] : [...data.linkedSubcontrolIDs]

      let reviewId = createdReviewIdRef.current
      if (!reviewId) {
        const input: CreateReviewInput = {
          title: data.title,
          status,
          reporter: session?.user?.email ?? undefined,
          reviewerID: session?.user?.userId ?? undefined,
          reportedAt: new Date().toISOString(),
          ...(data.testApplied ? { details: data.testApplied } : {}),
          ...(data.externalID ? { externalID: data.externalID } : {}),
          controlIDs,
          subcontrolIDs,
          ...(programId ? { programIDs: [programId] } : {}),
        }

        const res = await createReview({ input })
        reviewId = res.createReview.review.id
        createdReviewIdRef.current = reviewId
      }

      const auditorNotesHtml = await resolveAuditorNotesHtml(data.auditorNotes, plateEditorHelper)
      if (auditorNotesHtml && !commentSavedRef.current) {
        await updateReview({ updateReviewId: reviewId, input: { addComment: { text: auditorNotesHtml } } })
        commentSavedRef.current = true
      }

      if (hasFindingInput(data)) {
        let findingId = createdFindingIdRef.current
        if (!findingId) {
          const createdFinding = await createFinding({ input: buildFindingInput(data, { reviewId, subcontrolId }) })
          findingId = createdFinding?.createFinding?.finding?.id ?? null
          createdFindingIdRef.current = findingId
        }

        if (!findingId) {
          throw new Error('Finding could not be created')
        }

        if (!subcontrolId && !findingLinkedRef.current) {
          await createFindingControl({ input: { findingID: findingId, controlID: controlId } })
          findingLinkedRef.current = true
        }
      }

      queryClient.invalidateQueries({ queryKey: ['controls', controlId, 'associations'] })

      successNotification({ title: status === ReviewReviewStatus.COMPLETED ? 'Review created' : 'Draft saved', description: `The review has been saved as ${getEnumLabel(status)}.` })
      resetAndClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <SheetContent
        minWidth={600}
        className="flex flex-col"
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <span className="text-2xl leading-8 font-medium">Create Review</span>
              <X aria-label="Close create review sheet" size={20} className="cursor-pointer" onClick={resetAndClose} />
            </div>
          </SheetHeader>
        }
      >
        <Form {...form}>
          <form className="flex flex-col gap-4 pr-2 pb-4" onSubmit={(e) => e.preventDefault()}>
            <ControlContextPanel control={control}>
              <RelatedControlsSelector form={form} controlId={controlId} />
            </ControlContextPanel>

            <UploadedEvidenceSection items={evidenceItems} controlId={controlId} programId={programId} onView={(evidenceId) => push({ id: evidenceId })} />

            <ReviewFieldsPanel form={form} clearAuditorNotes={clearAuditorNotes} onAuditorNotesCleared={() => setClearAuditorNotes(false)} />

            <FindingFieldsPanel form={form} />
          </form>
        </Form>

        <ReviewSheetFooter pendingAction={pendingAction} onCancel={resetAndClose} onSubmit={(status) => form.handleSubmit((data) => submit(data, status))()} submitLabel="Create Review" />
      </SheetContent>
    </Sheet>
  )
}

export default CreateControlReviewSheet
