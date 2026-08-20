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
}

export type BulkUpdateOutcomeArgs = {
  requestedCount: number
  updatedIDs?: readonly string[] | null
  singular: string
  plural?: string
}

export const getBulkUpdateOutcome = ({ requestedCount, updatedIDs, singular, plural }: BulkUpdateOutcomeArgs): BulkUpdateOutcome => {
  const updatedCount = Math.min(updatedIDs?.length ?? 0, requestedCount)
  const pluralLabel = plural ?? pluralizeTypeName(singular)

  if (updatedCount >= requestedCount) {
    return { status: 'success', title: `Successfully bulk updated selected ${requestedCount === 1 ? singular : pluralLabel}.` }
  }

  const description = errorCodeMessages[GraphQlResponseError.BulkActionIncompleteErrorCode]

  if (updatedCount === 0) {
    return { status: 'failure', title: requestedCount === 1 ? `The ${singular} was not updated.` : `No ${pluralLabel} were updated.`, description }
  }

  return { status: 'partial', title: `Only ${updatedCount} of ${requestedCount} ${pluralLabel} were updated.`, description }
}
