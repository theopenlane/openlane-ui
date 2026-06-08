import type usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type ReviewFormData } from '../hooks/use-form-schema'
import { type Value } from 'platejs'
import { type UpdateReviewInput } from '@repo/codegen/src/schema'

type BuildPayloadOptions = {
  dirtyFields?: Partial<Record<keyof ReviewFormData, unknown>>
  useClearFlags?: boolean
}

const toISOString = (value: string | Date | null | undefined): string | undefined => {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  return value
}

const toStringObject = (value: string | null | undefined, field: keyof ReviewFormData, clearField: keyof UpdateReviewInput, options: BuildPayloadOptions) =>
  value?.trim() ? { [field]: value } : options.useClearFlags && options.dirtyFields?.[field] ? { [clearField]: true } : {}

export const buildPayload = async (data: ReviewFormData, plateEditorHelper: ReturnType<typeof usePlateEditor>, options: BuildPayloadOptions = {}) => {
  const { summary, category, classification, state, source, reporter, externalID, externalOwnerID, externalURI, environmentName, scopeName, ...rest } = data
  const details = rest.details ? await plateEditorHelper.convertToHtml(rest.details as Value) : undefined

  return {
    ...rest,
    ...toStringObject(summary, 'summary', 'clearSummary', options),
    ...toStringObject(category, 'category', 'clearCategory', options),
    ...toStringObject(classification, 'classification', 'clearClassification', options),
    ...toStringObject(state, 'state', 'clearState', options),
    ...toStringObject(source, 'source', 'clearSource', options),
    ...toStringObject(reporter, 'reporter', 'clearReporter', options),
    ...toStringObject(externalID, 'externalID', 'clearExternalID', options),
    ...toStringObject(externalOwnerID, 'externalOwnerID', 'clearExternalOwnerID', options),
    ...toStringObject(externalURI, 'externalURI', 'clearExternalURI', options),
    ...toStringObject(environmentName, 'environmentName', 'clearEnvironmentName', options),
    ...toStringObject(scopeName, 'scopeName', 'clearScopeName', options),
    details,
    approvedAt: toISOString(rest.approvedAt),
    reportedAt: toISOString(rest.reportedAt),
    reviewedAt: toISOString(rest.reviewedAt),
  }
}
