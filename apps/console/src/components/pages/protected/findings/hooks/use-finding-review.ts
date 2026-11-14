'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { buildResponsibilityInlineUpdate } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { invalidateFindingQueries, useUpdateFinding } from '@/lib/graphql-hooks/finding'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TMarkReviewedOptions = {
  currentReviewerUserID?: string | null
  canEdit: boolean
}

export const useFindingReviewer = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { mutateAsync: updateFinding } = useUpdateFinding()
  const { errorNotification } = useNotification()
  const reviewerUserID = session?.user?.userId

  return useCallback(
    async (findingId: string, { currentReviewerUserID, canEdit }: TMarkReviewedOptions) => {
      try {
        if (canEdit && reviewerUserID && currentReviewerUserID !== reviewerUserID) {
          const input = buildResponsibilityInlineUpdate('reviewedBy', { type: 'user', value: reviewerUserID }) as UpdateFindingInput
          await updateFinding({ updateFindingId: findingId, input })
        }
      } catch (error) {
        errorNotification({ title: 'Reviewer not recorded', description: parseErrorMessage(error) })
      } finally {
        invalidateFindingQueries(queryClient)
      }
    },
    [errorNotification, queryClient, reviewerUserID, updateFinding],
  )
}
