import { errorCodeMessages, GraphQlResponseError } from '@/constants/graphQlResponseError'
import { pluralizeTypeName } from '@/utils/strings'

type BulkActionFailureDescriptionArgs = {
  failedCount: number
  singular: string
  fallback: string
  verb?: string
}

export const getBulkActionFailureDescription = ({ failedCount, singular, fallback, verb = 'did not succeed' }: BulkActionFailureDescriptionArgs) => {
  if (failedCount < 1) {
    return fallback
  }

  return `${failedCount} ${singular}${failedCount === 1 ? '' : 's'} ${verb}.`
}

export type BulkUpdateStatus = 'success' | 'partial' | 'failure'

export type BulkUpdateOutcome = {
  status: BulkUpdateStatus
  title: string
  description?: string
  failedIDs: string[]
}

export type BulkUpdateOutcomeArgs = {
  requestedCount: number
  updatedIDs?: readonly string[] | null
  notUpdatedIDs?: readonly string[] | null
  error?: string | null
  singular: string
  plural?: string
}

export const getBulkUpdateErrorDescription = (error?: string | null) => (error ? errorCodeMessages[error] : undefined) ?? errorCodeMessages[GraphQlResponseError.BulkActionIncompleteErrorCode]

export const getBulkUpdateOutcome = ({ requestedCount, updatedIDs, notUpdatedIDs, error, singular, plural }: BulkUpdateOutcomeArgs): BulkUpdateOutcome => {
  const failedIDs = [...(notUpdatedIDs ?? [])]
  const updatedCount = Math.min(updatedIDs?.length ?? 0, requestedCount)
  const failedCount = failedIDs.length || Math.max(requestedCount - updatedCount, 0)
  const pluralLabel = plural ?? pluralizeTypeName(singular)

  if (failedCount === 0) {
    return { status: 'success', title: `Successfully bulk updated selected ${requestedCount === 1 ? singular : pluralLabel}.`, failedIDs }
  }

  const description = getBulkUpdateErrorDescription(error)

  if (failedCount >= requestedCount) {
    return { status: 'failure', title: requestedCount === 1 ? `The ${singular} was not updated.` : `No ${pluralLabel} were updated.`, description, failedIDs }
  }

  return { status: 'partial', title: `Only ${requestedCount - failedCount} of ${requestedCount} ${pluralLabel} were updated.`, description, failedIDs }
}
