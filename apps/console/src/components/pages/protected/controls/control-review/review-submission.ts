import { type CreateFindingInput } from '@repo/codegen/src/schema'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { type ControlReviewFormData } from './use-control-review-form-schema'

export type TLinkedIds = { controlIDs: string[]; subcontrolIDs: string[] }

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
