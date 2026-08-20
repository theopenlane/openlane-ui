import { useCallback } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { type BulkUpdateOutcomeArgs, getBulkUpdateOutcome } from './bulk-action-feedback'

export const useBulkUpdateFeedback = () => {
  const { successNotification, warningNotification, errorNotification } = useNotification()

  const notifyBulkUpdate = useCallback(
    (args: BulkUpdateOutcomeArgs): boolean => {
      const outcome = getBulkUpdateOutcome(args)
      const notify = { success: successNotification, partial: warningNotification, failure: errorNotification }[outcome.status]

      notify({ title: outcome.title, description: outcome.description })

      return outcome.status === 'success'
    },
    [successNotification, warningNotification, errorNotification],
  )

  return { notifyBulkUpdate }
}
