import { useState } from 'react'
import { isAfter, isFuture, startOfDay, subMonths } from 'date-fns'
import { EntityFrequency } from '@repo/codegen/src/schema'
import { useReviewsWithFilter } from '@/lib/graphql-hooks/review'

const REVIEW_FREQUENCY_MONTHS: Record<EntityFrequency, number | null> = {
  [EntityFrequency.MONTHLY]: 1,
  [EntityFrequency.QUARTERLY]: 3,
  [EntityFrequency.BIANNUALLY]: 6,
  [EntityFrequency.YEARLY]: 12,
  [EntityFrequency.BIENNIALLY]: 24,
  [EntityFrequency.TRIENNIALLY]: 36,
  [EntityFrequency.NONE]: null,
}

const DEFAULT_REVIEW_FREQUENCY = EntityFrequency.YEARLY

type UseHasRecentReviewArgs = {
  entityId: string
  lastReviewedAt?: string | null
  reviewFrequency?: EntityFrequency | null
  enabled?: boolean
}

export const useHasRecentReview = ({ entityId, lastReviewedAt, reviewFrequency, enabled = true }: UseHasRecentReviewArgs) => {
  const [now] = useState(() => Date.now())

  const lookbackMonths = REVIEW_FREQUENCY_MONTHS[reviewFrequency ?? DEFAULT_REVIEW_FREQUENCY]
  const cutoff = lookbackMonths === null ? null : startOfDay(subMonths(now, lookbackMonths)).toISOString()

  const reviewedDate = lastReviewedAt ? new Date(lastReviewedAt) : null
  const isLastReviewedAtRecent = !!reviewedDate && !isFuture(reviewedDate) && (!cutoff || isAfter(reviewedDate, new Date(cutoff)))

  const { reviewsNodes, isLoading, isPlaceholderData } = useReviewsWithFilter({
    where: {
      hasEntitiesWith: [{ id: entityId }],
      ...(cutoff ? { or: [{ reviewedAtGTE: cutoff }, { reviewedAtIsNil: true, createdAtGTE: cutoff }] } : {}),
    },
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
    enabled: enabled && !isLastReviewedAtRecent,
  })

  return {
    hasRecentReview: isLastReviewedAtRecent || reviewsNodes.length > 0,
    isLoading: isLoading || isPlaceholderData,
  }
}
