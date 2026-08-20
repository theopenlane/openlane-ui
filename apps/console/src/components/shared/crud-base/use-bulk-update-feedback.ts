import { type Dispatch, type SetStateAction, useCallback } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { type BulkUpdateOutcomeArgs, getBulkUpdateOutcome } from './bulk-action-feedback'

type NotifyBulkUpdateArgs<T extends { id: string }> = BulkUpdateOutcomeArgs & {
  setSelected?: Dispatch<SetStateAction<T[]>>
}

export const useBulkUpdateFeedback = () => {
  const { successNotification, warningNotification, errorNotification } = useNotification()

  const notifyBulkUpdate = useCallback(
    <T extends { id: string }>({ setSelected, ...args }: NotifyBulkUpdateArgs<T>): boolean => {
      const outcome = getBulkUpdateOutcome(args)
      const notify = { success: successNotification, partial: warningNotification, failure: errorNotification }[outcome.status]

      notify({ title: outcome.title, description: outcome.description })

      if (setSelected) {
        if (outcome.status === 'success') {
          setSelected([])
        } else if (outcome.failedIDs.length > 0) {
          setSelected((selected) => selected.filter((item) => outcome.failedIDs.includes(item.id)))
        }
      }

      return outcome.status === 'success'
    },
    [successNotification, warningNotification, errorNotification],
  )

  return { notifyBulkUpdate }
}
