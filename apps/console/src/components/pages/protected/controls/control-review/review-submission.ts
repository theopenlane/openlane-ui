import { type CreateFindingInput } from '@repo/codegen/src/schema'
import { isPlateValueEmpty } from '@/components/shared/plate/plate-utils'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import type usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type ControlReviewFormData } from './use-control-review-form-schema'

type TPlateEditorHelper = Pick<ReturnType<typeof usePlateEditor>, 'convertToHtml'>

export type TLinkedIds = { controlIDs: string[]; subcontrolIDs: string[] }

export const resolveAuditorNotesHtml = async (notes: ControlReviewFormData['auditorNotes'], plateEditorHelper: TPlateEditorHelper): Promise<string | null> => {
  if (!notes || isPlateValueEmpty(notes)) {
    return null
  }

  return typeof notes === 'string' ? notes : plateEditorHelper.convertToHtml(notes)
}

export const buildLinkedAssociationInput = (initial: TLinkedIds, formData: ControlReviewFormData) =>
  getAssociationInput(initial, { controlIDs: formData.linkedControlIDs, subcontrolIDs: formData.linkedSubcontrolIDs })

export const hasFindingInput = (formData: ControlReviewFormData) => !!(formData.findingTitle?.trim() || formData.findingDescription?.trim() || formData.findingSeverity)

export const buildFindingInput = (formData: ControlReviewFormData, { reviewId, subcontrolId }: { reviewId: string; subcontrolId?: string }): CreateFindingInput => ({
  findingStatusName: 'Open',
  open: true,
  reviewIDs: [reviewId],
  ...(subcontrolId ? { subcontrolIDs: [subcontrolId] } : {}),
  ...(formData.findingTitle?.trim() ? { displayName: formData.findingTitle.trim() } : {}),
  ...(formData.findingDescription?.trim() ? { description: formData.findingDescription.trim() } : {}),
  ...(formData.findingSeverity ? { severity: formData.findingSeverity } : {}),
})
