import { type UpdateReviewInput } from '@repo/codegen/src/schema'
import { associationsInput, dateOrClear, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type ReviewFormData } from './use-form-schema'

export const REVIEW_UPDATE_FIELDS = {
  details: richTextOrClear('clearDetails'),
  tags: orClear('clearTags'),
  summary: orClear('clearSummary'),
  category: orClear('clearCategory'),
  classification: orClear('clearClassification'),
  status: orClear('clearStatus'),
  source: orClear('clearSource'),
  reporter: orClear('clearReporter'),
  approved: orClear('clearApproved'),
  approvedAt: dateOrClear('clearApprovedAt'),
  reportedAt: dateOrClear('clearReportedAt'),
  reviewedAt: dateOrClear('clearReviewedAt'),
  externalID: orClear('clearExternalID'),
  externalOwnerID: orClear('clearExternalOwnerID'),
  externalURI: orClear('clearExternalURI'),
  environmentName: orClear('clearEnvironmentName'),
  scopeName: orClear('clearScopeName'),
  controlIDs: associationsInput('controlIDs'),
  subcontrolIDs: associationsInput('subcontrolIDs'),
  remediationIDs: associationsInput('remediationIDs'),
  entityIDs: associationsInput('entityIDs'),
  taskIDs: associationsInput('taskIDs'),
  assetIDs: associationsInput('assetIDs'),
  programIDs: associationsInput('programIDs'),
  riskIDs: associationsInput('riskIDs'),
} satisfies TFieldMappers<ReviewFormData, UpdateReviewInput>
