import { useState } from 'react'
import { isAfter, isFuture, startOfDay, subYears } from 'date-fns'
import { useReviewsWithFilter } from '@/lib/graphql-hooks/review'

const RECENT_REVIEW_LOOKBACK_YEARS = 1

type UseHasRecentReviewArgs = {
  entityId: string
  lastReviewedAt?: string | null
  enabled?: boolean
}

export const useHasRecentReview = ({ entityId, lastReviewedAt, enabled = true }: UseHasRecentReviewArgs) => {
  const [cutoff] = useState(() => startOfDay(subYears(new Date(), RECENT_REVIEW_LOOKBACK_YEARS)).toISOString())

  const reviewedDate = lastReviewedAt ? new Date(lastReviewedAt) : null
  const isLastReviewedAtRecent = !!reviewedDate && isAfter(reviewedDate, new Date(cutoff)) && !isFuture(reviewedDate)

  const { reviewsNodes, isLoading, isPlaceholderData } = useReviewsWithFilter({
    where: {
      hasEntitiesWith: [{ id: entityId }],
      or: [{ reviewedAtGTE: cutoff }, { reviewedAtIsNil: true, createdAtGTE: cutoff }],
    },
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
    enabled: enabled && !isLastReviewedAtRecent,
  })

  return {
    hasRecentReview: isLastReviewedAtRecent || reviewsNodes.length > 0,
    isLoading: isLoading || isPlaceholderData,
  }
}
