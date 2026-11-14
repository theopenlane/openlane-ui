'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { responsibilityInput } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useUpdateFinding } from '@/lib/graphql-hooks/finding'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { FINDING_REVIEWER } from '../finding-responsibility'

type TMarkReviewedOptions = {
  currentReviewerUserID?: string | null
  canEdit: boolean
}

const reviewedByInput = responsibilityInput(FINDING_REVIEWER)

export const useFindingReviewer = () => {
  const { data: session } = useSession()
  const { mutateAsync: updateFinding } = useUpdateFinding()
  const { errorNotification } = useNotification()
  const reviewerUserID = session?.user?.userId

  return useCallback(
    async (findingId: string, { currentReviewerUserID, canEdit }: TMarkReviewedOptions) => {
      if (!canEdit || !reviewerUserID || currentReviewerUserID === reviewerUserID) return
      try {
        await updateFinding({ updateFindingId: findingId, input: reviewedByInput({ type: 'user', value: reviewerUserID }) })
      } catch (error) {
        errorNotification({ title: 'Reviewer not recorded', description: parseErrorMessage(error) })
      }
    },
    [errorNotification, reviewerUserID, updateFinding],
  )
}
